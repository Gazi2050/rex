# rex-shell-integration (fish)
# Emits OSC 7 (cwd) + OSC 133 A/B/C/D so the host tracks cwd and prompt
# boundaries without re-parsing the prompt. fish 4.0+ writes its own OSC 133
# A/B (the `mark-prompt` feature); Rex disables it at spawn via
# fish_features=no-mark-prompt so these markers aren't emitted twice.

# Installed into conf.d, which every fish session sources; only Rex-spawned
# shells (REX_TERMINAL=1) may get their prompt wrapped.
if not set -q REX_TERMINAL
    exit 0
end
if set -q __REX_HOOKS_LOADED
    exit 0
end
set -g __REX_HOOKS_LOADED 1

if set -q REX_CLI; and test -x "$REX_CLI"
    function rex
        command "$REX_CLI" $argv
    end
end

# Rex is a clean terminal; drop fish's default startup greeting. A user who
# sets their own in config.fish (sourced after this) keeps it.
function fish_greeting
end

set -g __REX_HOST (uname -n 2>/dev/null; or echo localhost)

# Explicit high-contrast truecolor styles keep ls directories distinct
# from ordinary files, independent of the host ANSI palette.
set -gx LS_COLORS "di=01;38;2;77;166;255:ln=01;38;2;95;220;220:so=01;35:do=01;35:ex=01;32:bd=01;33:cd=01;33:or=00;31:mi=00;31:*.tar=01;31:*.tgz=01;31:*.zip=01;31:*.jpg=00;35:*.jpeg=00;35:*.png=00;35:*.svg=00;35"

# URL-encode a path keeping `/` intact so it stays valid inside file://.
function __rex_urlencode_path
    set -l parts (string split '/' -- $argv[1])
    set -l out
    for p in $parts
        if test -n "$p"
            set out $out (string escape --style=url -- $p)
        else
            set out $out ""
        end
    end
    string join '/' $out
end

function __rex_restore_status
    return $argv[1]
end

function __rex_capture_user_prompt
    if not functions -q fish_prompt
        return
    end
    if functions fish_prompt | string match -q '*__rex_user_prompt*'
        return
    end
    functions -e __rex_user_prompt 2>/dev/null
    functions -c fish_prompt __rex_user_prompt
end

# Wrapped so `fish -C __rex_install_prompt` can re-run it AFTER config.fish,
# where a framework prompt (starship etc.) would otherwise override fish_prompt
# and drop our markers.
function __rex_install_prompt
    # ponytail: cover Conda's named wrapper; generalize if another prompt
    # framework preserves Rex indirectly.
    if functions -q __fish_prompt_orig
        and functions fish_prompt | string match -q '*__fish_prompt_orig*'
        and functions __fish_prompt_orig | string match -q '*__rex_user_prompt*'
        return
    end
    __rex_capture_user_prompt
    function fish_prompt
        set -l __rex_status $status
        printf '\e]133;D;%d\e\\' $__rex_status
        printf '\e]7;file://%s%s\e\\' "$__REX_HOST" (__rex_urlencode_path "$PWD")
        # Warp-style env report for the context chips. node is forked only when
        # cwd or PATH changed (`nvm use` changes PATH), so the value tracks the
        # user's real shell. Branch changes via `git checkout` without PATH
        # moving, so it is probed every prompt like Warp's precmd payload.
        set -l __rex_node_key "$PWD:$PATH"
        if test "$__rex_node_key" != "$__rex_node_env_key"
            set -g __rex_node_env_key "$__rex_node_key"
            set -l __rex_node (node --version 2>/dev/null)
            if test -n "$__rex_node"
                printf '\e]6637;node=%s\e\\' "$__rex_node"
            end
        end
        if type -q git
            set -l __rex_branch (git symbolic-ref --short -q HEAD 2>/dev/null; or git rev-parse --short HEAD 2>/dev/null)
            if test -n "$__rex_branch"
                printf '\e]6637;branch=%s\e\\' (string escape --style=url -- "$__rex_branch")
            end
        end
        printf '\e]133;A\e\\'
        __rex_restore_status $__rex_status
        if functions -q __rex_user_prompt
            __rex_user_prompt
        else
            printf '%s > ' (prompt_pwd)
        end
        printf '\e]133;B\e\\'
    end
end
__rex_install_prompt

function __rex_preexec --on-event fish_preexec
    set -l cmd (string replace -ra '[\x00-\x1f\x7f]' ' ' -- "$argv")
    printf '\e]133;C;%s\e\\' (string sub -l 256 -- "$cmd")
end
