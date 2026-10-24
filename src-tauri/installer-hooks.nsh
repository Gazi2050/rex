; "Open in Rex" shell verbs for folders, folder backgrounds, and drives.
; HKCU matches installer currentUser scope. %V = clicked path.
; NoWorkingDirectory keeps Explorer from overriding %V (System32 on Drive).

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInRex" "" "Open in Rex Terminal"
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInRex" "Icon" '"$INSTDIR\rex-terminal.exe",0'
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInRex" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Directory\shell\OpenInRex\command" "" '"$INSTDIR\rex-terminal.exe" "%V"'

  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInRex" "" "Open in Rex Terminal"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInRex" "Icon" '"$INSTDIR\rex-terminal.exe",0'
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInRex" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\OpenInRex\command" "" '"$INSTDIR\rex-terminal.exe" "%V"'

  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInRex" "" "Open in Rex Terminal"
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInRex" "Icon" '"$INSTDIR\rex-terminal.exe",0'
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInRex" "NoWorkingDirectory" ""
  WriteRegStr HKCU "Software\Classes\Drive\shell\OpenInRex\command" "" '"$INSTDIR\rex-terminal.exe" "%V"'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKCU "Software\Classes\Directory\shell\OpenInRex"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\OpenInRex"
  DeleteRegKey HKCU "Software\Classes\Drive\shell\OpenInRex"
!macroend
