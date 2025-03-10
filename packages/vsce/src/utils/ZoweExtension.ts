import { getCICSProfileDefinition } from "@zowe/cics-for-zowe-sdk";
import { Gui, MessageSeverity, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import { extensions } from "vscode";


class SZoweExtension {
  private static _instance: SZoweExtension;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  private zoweExplorerAPI = ZoweVsCodeExtension.getZoweExplorerApi();
  private profilesCache = this.zoweExplorerAPI.getExplorerExtenderApi().getProfilesCache();

  getVersion() {
    const extension = extensions.getExtension("zowe.vscode-extension-for-zowe");
    return extension?.packageJSON?.version;
  }

  async registerCICSProfiles() {
    await this.zoweExplorerAPI.getExplorerExtenderApi().initForZowe("cics", [getCICSProfileDefinition()]);
    this.profilesCache.registerCustomProfilesType("cics");
    await this.zoweExplorerAPI.getExplorerExtenderApi().reloadProfiles();
  }

  async refreshProfilesCache() {
    await this.profilesCache.refresh(this.zoweExplorerAPI);
  }

  validAPI() {
    const version = this.getVersion();

    if (!version || version[0] !== "3") {
      Gui.showMessage(
        `Please ensure Zowe Explorer v3.0.0 or higher is installed`, {
        severity: MessageSeverity.ERROR,
      });
      return false;
    }

    if (!this.apiExists()) {
      Gui.showMessage(
        "Zowe Explorer was not found: either it is not installed or you are using an older version without extensibility API. " +
        "Please ensure Zowe Explorer v3.0.0 or higher is installed",
        {
          severity: MessageSeverity.ERROR
        }
      );
      return false;
    }

    return true;
  }

  apiExists() {
    if (this.zoweExplorerAPI) {
      return true;
    }
    return false;
  }

  getAPI() {
    return this.zoweExplorerAPI;
  }

  getProfilesCache() {
    return this.profilesCache;
  }
}

const ZoweExtension = SZoweExtension.Instance;
export default ZoweExtension;
