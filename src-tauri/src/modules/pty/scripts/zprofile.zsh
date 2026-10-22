# rex-shell-integration (zprofile)
#
# See zshenv.zsh for the rationale on the trailing `:`.
{
  _rex_user_zdotdir="${REX_USER_ZDOTDIR:-$HOME}"
  [ -f "$_rex_user_zdotdir/.zprofile" ] && source "$_rex_user_zdotdir/.zprofile"
  unset _rex_user_zdotdir
}
:
