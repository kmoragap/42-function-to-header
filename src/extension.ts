import * as vscode from 'vscode';
import * as fs from 'fs';

function updateFunctionHeader(fileName: string, functionName: string, headerPath: string) {
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  let updatedHeaderContent = headerContent;

  if (headerContent.includes('/* FUNCTIONS */')) {
    updatedHeaderContent = headerContent.replace(/\/\*\s*FUNCTIONS\s*\*\//, `$&\n${functionName};`);
  } else {
    const endIndex = headerContent.lastIndexOf('#endif');
    updatedHeaderContent = headerContent.slice(0, endIndex) + `\n/* FUNCTIONS */\n${functionName};\n\n` + headerContent.slice(endIndex);
  }

  fs.writeFileSync(headerPath, updatedHeaderContent, 'utf8');
  vscode.window.showInformationMessage(`The ${functionName} function has been added to the ${headerPath} header.`);
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerTextEditorCommand(
    'extension.updateFunctionHeader',
    (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
      const fileName = textEditor.document.fileName;
      const functionName = textEditor.document.getText(textEditor.selection);
      if (fileName && functionName) {
        const config = vscode.workspace.getConfiguration();
        const headerPath = config.get('functionHeaderExtension.headerFilePath', '');

        if (headerPath) {
          updateFunctionHeader(fileName, functionName, headerPath);
        } else {
          vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
              'C Header Files': ['h'],
              'All Files': ['*']
            }
          }).then((uris: vscode.Uri[] | undefined) => {
            if (uris && uris.length > 0) {
              const selectedHeaderPath = uris[0].fsPath;
              config.update('functionHeaderExtension.headerFilePath', selectedHeaderPath, vscode.ConfigurationTarget.Workspace).then(() => {
                updateFunctionHeader(fileName, functionName, selectedHeaderPath);
              });
            }
          });
        }
      }
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
