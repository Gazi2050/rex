set -gx REX_TERMINAL 1
set -l script_dir (dirname (status filename))

function fish_prompt
    printf base
end

source "$script_dir/init.fish"

string match -q 'di=01;38;2;77;166;255' -- $LS_COLORS; or exit 1

# Conda preserves the prompt installed from conf.d before wrapping it.
functions -c fish_prompt __fish_prompt_orig
function fish_prompt
    printf conda
    __fish_prompt_orig
end

__rex_install_prompt

set -l rendered (fish_prompt)
test (string match -ra conda -- "$rendered" | count) -eq 1; or exit 1
test (string match -ra base -- "$rendered" | count) -eq 1; or exit 1
test (string match -ra '133;D;' -- "$rendered" | count) -eq 1; or exit 1
test (string match -ra '133;A' -- "$rendered" | count) -eq 1; or exit 1
test (string match -ra '133;B' -- "$rendered" | count) -eq 1; or exit 1
test (string match -ra '7;file://' -- "$rendered" | count) -eq 1; or exit 1

# Legacy block-mode environment variables must not suppress normal shell input.
set -gx REX_BLOCKS 1
__rex_install_prompt
set rendered (fish_prompt)
string match -q '*replacement*' -- "$rendered"; or exit 1

# Replacements that preserve Conda's helper but do not delegate to it still
# need the post-config rewrap.
functions -e __rex_user_prompt fish_prompt
function fish_prompt
    printf replacement
end
__rex_install_prompt
set rendered (fish_prompt)
test (string match -ra replacement -- "$rendered" | count) -eq 1; or exit 1
test (string match -ra '133;D;' -- "$rendered" | count) -eq 1; or exit 1
test (string match -ra '133;A' -- "$rendered" | count) -eq 1; or exit 1
test (string match -ra '133;B' -- "$rendered" | count) -eq 1; or exit 1
test (string match -ra '7;file://' -- "$rendered" | count) -eq 1; or exit 1
