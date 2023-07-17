import * as fs from 'fs';
import * as vscode from 'vscode';
import {exec} from 'child_process';
import * as path from 'path';

export function isExistingExecutable(input: string): boolean {
  // Check if the input is an alias
  if (isExecutableAlias(input)) {
    return true;
  }

  // Check if the input is an existing file
  try {
    return hasExecutablePermission(input);
  } catch (error) {
    return false;
  }
}

function isExecutableAlias(input: string): boolean {
  // Implement your own logic to determine if the input is an executable alias
  // For example, you can check if it matches a predefined list of aliases

  const executableAliases = ['python', 'python3', 'py'];
  return executableAliases.includes(input);
}

function hasExecutablePermission(filePath: string): boolean {
    try {
      // Get the file's stats and check it exists
      const stats = fs.statSync(filePath);
      if (!stats.isFile()){
        return false;
      }

        // check if file is executable
        fs.access(filePath, fs.constants.X_OK, err => {
            console.log(`${filePath} ${err ? 'is not executable' : 'is executable'}`)
        });
      return true
    } catch (error) {
      // Handle file not found or permission denied errors
      console.error(error);
    }

    return false;
  }

export function executePython(command: string) {
    const python = vscode.workspace.getConfiguration().get("dsUtils.interpreter");
    const python_command = String(python).concat(
        " -m ",
        String(command),
    );
    console.log(python_command);


    return new Promise((resolve, reject)=>{
      exec(python_command, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`error: ${error.message}`);
            reject(error);
        }
        else if (stderr) {
            vscode.window.showErrorMessage(`stderr: ${stderr}`);
            reject(error);
        }
        else {
        console.log(stdout);
        resolve(stdout.trim());
        }
      });
    })

}

export function openNotebook(filePath: string){
    const notebookFilePath = filePath.replace(/\.py$/, '.ipynb');
    vscode.workspace.openNotebookDocument(notebookFilePath).then(document => {
        vscode.window.showNotebookDocument(document);
    });
}

export function openScript(filePath: string){
    const scriptFilePath = filePath.replace(/\.ipynb$/, '.py');
    vscode.workspace.openTextDocument(scriptFilePath).then(document => {
        vscode.window.showTextDocument(document);
    });
}

export function injectTableOfContents(filePath: string){
    const html_content = fs.readFileSync(filePath, 'utf-8');
    const toc_header = `
    <style>
    #toc {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #f1f1f1;
      padding: 10px;
      border-radius: 5px;
      max-height: 400px; /* Set the maximum height for scrolling */
      overflow-y: auto; /* Enable vertical scrolling */
    }

    #toc ul {
      list-style-type: none;
      padding: 0;
    }

    #toc ul li {
      margin-bottom: 5px;
    }

    #toc ul ul {
      margin-left: 10px;
    }

    #toc ul ul li {
      margin-bottom: 2px;
    }

    #toc ul li a {
      text-decoration: none;
      color: #333;
    }

    #toc ul li a:hover {
      text-decoration: underline;
    }

    #toc h3 {
      margin-bottom: 5px;
    }

    #toc .collapse-btn {
      cursor: pointer;
      font-size: 12px;
      color: #777;
      margin-right: 5px;
      text-decoration: underline;
    }
  </style>

  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script>
  $(document).ready(function() {
    var $toc = $('<div id="toc"></div>');
    var $tocHeader = $('<h3>Table of Contents <span class="collapse-btn">Collapse</span></h3>');
    var $tocList = $('<ul></ul>');

    var levelCounts = [0, 0, 0];

    $('h1, h2, h3').each(function() {
      var $header = $(this);
      var headerText = $header.text();
      var headerLevel = parseInt(this.tagName.substr(1)) - 1;

      levelCounts[headerLevel]++;
      for (var i = headerLevel + 1; i < levelCounts.length; i++) {
        levelCounts[i] = 0;
      }

      var headerId = 'header-' + levelCounts.slice(0, headerLevel + 1).join('.');
      $header.attr('id', headerId);

      var tocItemText = levelCounts.slice(0, headerLevel + 1).join('.') + ' ' + headerText;
      var $tocItem = $('<li><a href="#' + headerId + '">' + tocItemText + '</a></li>');

      if (headerLevel > 0) {
        var $parentList = $tocList.children('li').last().children('ul');
        if ($parentList.length === 0) {
          $parentList = $('<ul></ul>');
          $tocList.children('li').last().append($parentList);
        }
        $parentList.append($tocItem);
      } else {
        $tocList.append($tocItem);
      }

      $header.text(tocItemText + ' ');
    });

    var $collapseBtn = $tocHeader.find('.collapse-btn');
    var $tocListRootItems = $tocList.children('li');
    var isCollapsed = false;

    $collapseBtn.on('click', function() {
      isCollapsed = !isCollapsed;
      $tocListRootItems.toggle(!isCollapsed);
      $collapseBtn.text(isCollapsed ? 'Expand' : 'Collapse');
    });

    $toc.append($tocHeader);
    $toc.append($tocList);
    $('body').append($toc);
  });
  </script>
`;

    const headTagIndex = html_content.indexOf('</body>');
    if (headTagIndex !== -1) {
        const insertionIndex = headTagIndex + '</body>'.length;
        const combinedHTML = html_content.slice(0, insertionIndex) + toc_header + html_content.slice(insertionIndex);
        fs.writeFileSync(filePath, combinedHTML);
        vscode.window.showInformationMessage("Added TOC header to output html.");
    }
}
