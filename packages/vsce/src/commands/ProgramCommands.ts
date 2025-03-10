import { commands, WebviewPanel, window } from "vscode";
import { ICICSTreeNode, IProgram } from "../doc";
import { CicsCmciConstants, programNewcopy } from "@zowe/cics-for-zowe-sdk";
import { CICSResourceContainerNode, CICSTree } from "../trees";
import CICSRequester from "../utils/CICSRequester";
import { getAttributesHtml } from "../utils/webviewHTML";


class SProgramCommands {
  private static _instance: SProgramCommands;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  getCommands(cicsTree: CICSTree) {
    return [
      this.newCopy(cicsTree),
      this.phaseIn(cicsTree),
      this.showAttributes(cicsTree),
    ];
  }

  newCopy(tree: CICSTree) {
    return commands.registerCommand("cics-extension-for-zowe.newCopyProgram", async (_node: ICICSTreeNode) => {
      const nodes = tree.getTreeView().selection as CICSResourceContainerNode<IProgram>[];

      for (const node of nodes) {
        const { meta, resource } = node.getContainerResource();
        await programNewcopy(node.getSession(), {
          name: meta.getName(resource),
          regionName: node.regionName,
          cicsPlex: node.cicsplexName,
        });
      }

      tree.refresh(nodes[0].getParent());
    });
  }

  phaseIn(tree: CICSTree) {
    return commands.registerCommand("cics-extension-for-zowe.phaseInCommand", async (_node: ICICSTreeNode) => {
      const nodes = tree.getTreeView().selection as CICSResourceContainerNode<IProgram>[];

      for (const node of nodes) {
        const { meta, resource } = node.getContainerResource();

        await CICSRequester.put(
          node.getSession(),
          CicsCmciConstants.CICS_PROGRAM_RESOURCE,
          {
            cicsplexName: node.cicsplexName,
            regionName: node.regionName,
            criteria: `PROGRAM='${meta.getName(resource)}'`,
          },
          {
            request: {
              action: {
                $: {
                  name: "PHASEIN",
                },
              },
            },
          }
        );
      }

      tree.refresh(nodes[0].getParent());
    });
  }

  showAttributes(tree: CICSTree) {
    return commands.registerCommand("cics-extension-for-zowe.showProgramAttributes", (_node: ICICSTreeNode) => {

      const nodes = tree.getTreeView().selection as CICSResourceContainerNode<IProgram>[];

      for (const node of nodes) {
        const { resource } = node.getContainerResource();

        const attributeHeadings = Object.keys(resource.attributes);

        let webText = `<thead><tr>`;
        webText += `<th class="headingTH">Attribute <input type="text" id="searchBox" placeholder="Search Attribute..."/></th>`;
        webText += `<th class="valueHeading">Value</th>`;
        webText += `</tr></thead><tbody>`;

        for (const heading of attributeHeadings) {
          webText += `<tr><th class="colHeading">${heading.toUpperCase()}</th><td>${resource.attributes[heading as keyof IProgram]}</td></tr>`;
        }

        webText += "</tbody>";

        const webviewHTML = getAttributesHtml(resource.attributes.program, webText);
        const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
        const panel: WebviewPanel = window.createWebviewPanel(
          "zowe",
          `CICS Program ${node.regionName}(${resource.attributes.program})`,
          column || 1,
          { enableScripts: true }
        );
        panel.webview.html = webviewHTML;
      }

      tree.refresh(nodes[0].getParent());
    });
  }
}

const ProgramCommands = SProgramCommands.Instance;
export default ProgramCommands;
