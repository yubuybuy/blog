Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' 获取脚本所在目录
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
batFile = scriptPath & "\百度推送清单-增强版.bat"

' 检查批处理文件是否存在
If Not fso.FileExists(batFile) Then
    MsgBox "错误：未找到批处理文件！" & vbCrLf & batFile, vbCritical, "百度推送清单"
    WScript.Quit
End If

' 在新窗口中运行批处理文件
objShell.Run "cmd.exe /k """ & batFile & """", 1, False
