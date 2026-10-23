# rex-shell-integration (zshrc)
#
# Emits OSC 7 (cwd) + OSC 133 A/B/C/D (prompt-start / prompt-end / pre-exec /
# command-done-with-exit-code) so the host can detect command boundaries and
# track cwd without re-parsing the prompt. `status` is a read-only special in
# zsh, so we shadow $? into `_rex_ret`.

{
  _rex_user_zdotdir="${REX_USER_ZDOTDIR:-$HOME}"
  [ -f "$_rex_user_zdotdir/.zshrc" ] && source "$_rex_user_zdotdir/.zshrc"
  unset _rex_user_zdotdir
}

if [[ -n "$REX_CLI" && -x "$REX_CLI" ]]; then
  rex() {
    command "$REX_CLI" "$@"
  }
fi

# Re-source guard within a single shell (e.g. user runs `source ~/.zshrc`).
# This is NOT exported, so each nested zsh installs its own hooks — desired,
# since every interactive shell needs its own prompt integration.
if [[ -z "$__REX_HOOKS_LOADED" ]]; then
  __REX_HOOKS_LOADED=1
  autoload -Uz add-zsh-hook 2>/dev/null

  # URL-encode $PWD byte-wise so multi-byte paths stay valid in the `file://`
  # URI emitted via OSC 7. `no_multibyte` forces ${s[i]} to index bytes (not
  # code points), and LC_ALL=C keeps the [a-zA-Z0-9...] class single-byte.
  _rex_urlencode() {
    emulate -L zsh
    setopt localoptions no_multibyte
    local LC_ALL=C s="$1" i byte
    for (( i=1; i<=${#s}; i++ )); do
      byte="${s[i]}"
      case "$byte" in
        [a-zA-Z0-9/._~-]) printf '%s' "$byte" ;;
        *) printf '%%%02X' "'$byte" ;;
      esac
    done
  }

  _rex_precmd() {
    local _rex_ret=$?
    printf '\e]133;D;%s\e\\' "$_rex_ret"
    printf '\e]7;file://%s%s\e\\' "${HOST}" "$(_rex_urlencode "$PWD")"
    # Warp-style env report for the context chips. node is forked only when
    # cwd or PATH changed (`nvm use` changes PATH), so the value tracks the
    # user's real shell. Branch changes via `git checkout` without PATH moving,
    # so it is probed every prompt like Warp's precmd payload.
    local _rex_node_key="$PWD:$PATH"
    if [[ "$_rex_node_key" != "${_REX_NODE_KEY:-}" ]]; then
      _REX_NODE_KEY="$_rex_node_key"
      local _rex_node="$(node --version 2>/dev/null)"
      [[ -n "$_rex_node" ]] && printf '\e]6637;node=%s\e\\' "$_rex_node"
    fi
    if (( $+commands[git] )); then
      local _rex_branch="$(git symbolic-ref --short -q HEAD 2>/dev/null || git rev-parse --short HEAD 2>/dev/null)"
      [[ -n "$_rex_branch" ]] \
        && printf '\e]6637;branch=%s\e\\' "$(_rex_urlencode "$_rex_branch")"
    fi
    # In block mode the host renders its own input bar, so suppress the shell
    # prompt entirely (keep only the OSC 133 B marker) and add a leading blank
    # line so frozen command blocks get vertical breathing room.
    if [[ -n "$REX_BLOCKS" ]]; then
      # Spacing reserved for the host-drawn block header lives in the prompt
      # (the grid is WebGL, not CSS). Later prompts get two blank rows: the
      # upper one is the previous block's end gap (above its divider), the lower
      # one is this command's header row. The very first prompt has no block
      # above it, so it gets a single row (header only) to avoid a tall top gap.
      if [[ -n "$_rex_block_seen" ]]; then
        PS1=$'\n\n%{\e]133;B\e\\%}'
      else
        PS1=$'\n%{\e]133;B\e\\%}'
      fi
      RPROMPT=''
    elif [[ "$PS1" != *$'\e]133;B\e\\'* ]]; then
      # Re-inject prompt-end marker in case a framework rebuilt PS1 (p10k, starship).
      PS1=$'%{\e]133;B\e\\%}'"$PS1"
    fi
    printf '\e]133;A\e\\'
  }

  _rex_preexec() {
    # Mark that a real command ran, so the next prompt switches from one blank
    # row (first prompt, no block above) to two (end gap + header row).
    [[ -n "$REX_BLOCKS" ]] && _rex_block_seen=1
    local cmd="${1//[[:cntrl:]]/ }"
    printf '\e]133;C;%s\e\\' "${cmd[1,256]}"
  }

  if (( $+functions[add-zsh-hook] )); then
    add-zsh-hook precmd _rex_precmd
    add-zsh-hook preexec _rex_preexec
  fi

  # Warp/iTerm2-style word-end navigation: zsh's default `forward-word` (M-f /
  # Option+Right) overshoots to the START of the next word; `emacs-forward-word`
  # stops at the END of the current word, which is what nearly every other shell
  # and GUI editor does. Only rebind when the binding is still the stock zsh
  # default — respects any explicit remap in the user's .zshrc.
  if (( $+widgets[emacs-forward-word] )) \
     && [[ "$(bindkey '\ef')" == '"^[f" forward-word' ]]; then
    bindkey '\ef' emacs-forward-word
  fi

  _rex_precmd
fi
:
