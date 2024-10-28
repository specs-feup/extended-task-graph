import { Joinpoint } from "@specs-feup/clava/api/Joinpoints.js";
import { AstDumper } from "./AstDumper.js";

export class AstHtmlConverter extends AstDumper {
    protected levelEntry(label: string, indent: number): string {
        return `<li data-indent="${indent}"><span class="joinpoint expand-icon">${label}</span>`;
    }
    protected levelPrologue(): string {
        return "<ul>\n";
    }
    protected levelEpilogue(): string {
        return "</li></ul>\n";
    }

    public getFileExtension(): string {
        return "html";
    }

    public dump(startJp?: Joinpoint): string {
        const innerHtml = super.dump(startJp);

        const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clava AST dump</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #1e1e1e;
      color: #fff;
      margin: 20px;
    }
    ul {
      list-style-type: none;
      padding-left: 20px;
    }
    .directory {
      cursor: pointer;
      user-select: none;
    }
    .hidden {
      display: none;
    }
    .expand-icon::before {
      content: "▶";
      display: inline-block;
      margin-right: 5px;
      transition: transform 0.2s;
    }
    .expanded .expand-icon::before {
      transform: rotate(90deg);
    }
    .file {
      margin-left: 15px;
      color: #bbb;
    }
  </style>
</head>
<body>
  <div id="ast-tree">
   ${innerHtml}
  </div>
  <script>
    document.querySelectorAll('.joinpoint').forEach(dir => {
      dir.addEventListener('click', () => {
        const childUl = dir.nextElementSibling;
        if (childUl) {
          dir.classList.toggle('expanded');
          childUl.classList.toggle('hidden');
        }
      });
    });
  </script>
</body>
</html>
        `
        return template;
    }

}