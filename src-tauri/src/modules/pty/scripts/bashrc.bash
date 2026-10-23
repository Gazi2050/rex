# rex-shell-integration (bashrc)
#
# Differences vs zsh integration:
# - We emulate login-shell init manually (/etc/profile, profile files) because
#   bash ignores --rcfile when started with -l.
# - Pre-exec marker uses PS0 (bash 4.4+). On older bash (macOS default 3.2) we
#   skip it — a fragile DEBUG-trap alternative would clobber the user's own
#   traps and interact badly with debuggers.

if [ -z "$__REX_HOOKS_LOADED" ]; then
  __REX_HOOKS_LOADED=1

  [ -f /etc/profile ] && source /etc/profile
  [ -f /etc/bashrc ] && source /etc/bashrc
  if [ -f "$HOME/.bash_profile" ]; then
    source "$HOME/.bash_profile"
  elif [ -f "$HOME/.bash_login" ]; then
    source "$HOME/.bash_login"
  elif [ -f "$HOME/.profile" ]; then
    source "$HOME/.profile"
  fi
  # .bashrc may have been sourced already by .bash_profile; sourcing again is
  # safe for idempotent rc files (the common case). If yours has side effects
  # on reload, guard with a flag.
  [ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc"

  _rex_prompt_end='\[\e]133;B\e\\\]'

  if [ -n "$REX_CLI" ] && [ -x "$REX_CLI" ]; then
    rex() {
      command "$REX_CLI" "$@"
    }
  fi

  # Explicit high-contrast truecolor styles keep ls directories distinct
  # from ordinary files, independent of the host ANSI palette. The ls
  # function forces color even when the user's rc configured it as plain.
  LS_COLORS="di=01;38;2;77;166;255:ln=01;38;2;95;220;220:so=01;35:do=01;35:ex=01;32:bd=01;33:cd=01;33:or=00;31:mi=00;31:*.tar=01;31:*.tgz=01;31:*.zip=01;31:*.jpg=00;35:*.jpeg=00;35:*.png=00;35:*.svg=00;35"
  export LS_COLORS
  unalias ls 2>/dev/null || true
  ls() {
    command ls --color=always "$@"
  }

  _rex_urlencode() {
    local LC_ALL=C s="$1" i c
    for (( i=0; i<${#s}; i++ )); do
      c="${s:i:1}"
      case "$c" in
        [a-zA-Z0-9/._~-]) printf '%s' "$c" ;;
        *) printf '%%%02X' "'$c" ;;
      esac
    done
  }

  _rex_precmd() {
    local _rex_ret=$?
    printf '\e]133;D;%s\e\\' "$_rex_ret"
    printf '\e]7;file://%s%s\e\\' "${HOSTNAME:-$(uname -n 2>/dev/null)}" "$(_rex_urlencode "$PWD")"
    # Warp-style env report for the context chips. node is forked only when
    # cwd or PATH changed (`nvm use` changes PATH), so the value tracks the
    # user's real shell. Branch changes via `git checkout` without PATH moving,
    # so it is probed every prompt like Warp's precmd payload.
    _rex_node_key="$PWD:$PATH"
    if [ "$_rex_node_key" != "${_REX_NODE_KEY:-}" ]; then
      _REX_NODE_KEY="$_rex_node_key"
      _rex_node="$(node --version 2>/dev/null)"
      [ -n "$_rex_node" ] && printf '\e]6637;node=%s\e\\' "$_rex_node"
    fi
    if command -v git >/dev/null 2>&1; then
      _rex_branch="$(git symbolic-ref --short -q HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null)"
      [ -n "$_rex_branch" ] \
        && printf '\e]6637;branch=%s\e\\' "$(_rex_urlencode "$_rex_branch")"
    fi
    if [ -z "$__REX_PS1_INJECTED" ]; then
      PS1="${_rex_prompt_end}${PS1}"
      __REX_PS1_INJECTED=1
    fi
    printf '\e]133;A\e\\'
  }

  case ":${PROMPT_COMMAND:-}:" in
    *":_rex_precmd:"*) ;;
    *) PROMPT_COMMAND="_rex_precmd${PROMPT_COMMAND:+;$PROMPT_COMMAND}" ;;
  esac

  # Pre-exec marker via PS0 (bash 4.4+). PS0 is expanded just before a command
  # runs — cleaner than a DEBUG trap, which would clobber user traps and fire
  # on every command including inside PROMPT_COMMAND.
  if [ "${BASH_VERSINFO[0]:-0}" -gt 4 ] \
     || { [ "${BASH_VERSINFO[0]:-0}" -eq 4 ] && [ "${BASH_VERSINFO[1]:-0}" -ge 4 ]; }; then
    PS0='\[\e]133;C\e\\\]'"${PS0:-}"
  fi

  _rex_precmd
fi
:
