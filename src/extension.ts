// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {isExistingExecutable, executePython, openNotebook, openScript, injectTableOfContents} from './utils';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Datascientists Util is now active!');

	let disposable = vscode.commands.registerCommand('dsUtils.checkSettings', () => {
		const python = vscode.workspace.getConfiguration().get("dsUtils.interpreter");
		if(isExistingExecutable(String(python))){
			vscode.window.showInformationMessage("Python intrepreter is working.");
		}
		else{
			vscode.window.showInformationMessage("Python intrepreter isn't working.");
		}
	});

	let disposable2 = vscode.commands.registerCommand('dsUtils.scriptToNotebook', async (uri?: vscode.Uri) => {
		uri = uri || vscode.window.activeTextEditor?.document.uri;
		vscode.window.showInformationMessage("Exporting " + uri + " to a notebook file.");
		const command: string = 'jupytext --to notebook "' + uri.fsPath + '"';
		executePython(command);
		openNotebook(uri.fsPath);
	});
	
	let disposable3 = vscode.commands.registerCommand('dsUtils.notebookToScript', async (uri?: vscode.Uri) => {
		uri = uri || vscode.window.activeTextEditor?.document.uri;
		vscode.window.showInformationMessage("Exporting " + uri + " to a script file.");
		const command: string = 'jupytext --to py:percent "' + uri.fsPath + '"';
		executePython(command);
		openScript(uri.fsPath);
	});

	let disposable4 = vscode.commands.registerCommand('dsUtils.exportToHTML', async (uri?: vscode.Uri) => {
		uri = uri || vscode.window.activeTextEditor?.document.uri;
		vscode.window.showInformationMessage("Exporting " + uri + " to a html file.");
		const html_folder = vscode.workspace.getConfiguration().get("dsUtils.htmlFolder");
		var target_html: string;
		if(html_folder ==  '.'){
			target_html = uri.fsPath.replace(/\.ipynb$/, '.html');
		}else{
			const file_name = path.basename(uri.fsPath).replace(/\.ipynb$/, '.html');
			target_html = path.join(html_folder, file_name);
		}
		const command: string = 'jupyter nbconvert --to html --template classic "' + uri.fsPath + '" --output "' + target_html + '"';
		executePython(command);
		injectTableOfContents(target_html);
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
	context.subscriptions.push(disposable4);
}

// This method is called when your extension is deactivated
export function deactivate() {}
