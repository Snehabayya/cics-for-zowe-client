/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import { Gui, imperative } from "@zowe/zowe-explorer-api";
import { TreeView, TreeViewExpansionEvent } from "vscode";
import { ICICSTree, ICICSTreeNode } from "../doc";
import { CICSSession } from "../resources";
import { CICSSessionNode } from "./CICSSessionNode";
import { CICSTreeProvider } from "./CICSTreeProvider";
import ZoweExtension from "../utils/ZoweExtension";
import { PersistentStorage } from "../utils/PersistentStorage";

export class CICSTree extends CICSTreeProvider<ICICSTreeNode> implements ICICSTree<ICICSTreeNode> {
  sessionNodes: CICSSessionNode[];
  treeView: TreeView<ICICSTreeNode>;

  constructor() {
    super();
    this.treeView = Gui.createTreeView<ICICSTreeNode>("cics-view", {
      treeDataProvider: this,
      showCollapseAll: true,
      canSelectMany: true,
    });
    this.treeView.onDidExpandElement(async (e: TreeViewExpansionEvent<ICICSTreeNode>) => {

      if ("prefetch" in e.element) {
        await e.element.prefetch();
      }

      e.element.refreshIcon(true);
      this.mOnDidChangeTreeData.fire(e.element);
    });
    this.treeView.onDidCollapseElement((e: TreeViewExpansionEvent<ICICSTreeNode>) => {
      e.element.refreshIcon(false);
      this.mOnDidChangeTreeData.fire(e.element);
    });
    this.sessionNodes = [];
  }

  async getChildren(element?: ICICSTreeNode | undefined): Promise<ICICSTreeNode[]> {
    if (element) {
      const response = await element.getChildren();
      return response;
    }
    return this.sessionNodes;
  }

  public getTreeView(): TreeView<ICICSTreeNode> {
    return this.treeView;
  }

  private addSingleSession(profile: imperative.IProfileLoaded): Promise<void> {
    if (!profile || this.sessionNodes.find((tNode) => tNode.label.toString() === profile.name)) {
      return;
    }

    const sessionNode = new CICSSessionNode({
      profile,
      session: new CICSSession(profile.profile),
      tree: this,
    });

    this.sessionNodes.push(sessionNode);
  }

  public async loadProfileByPersistedProfile(): Promise<void> {
    const persistentStorage = new PersistentStorage("zowe.cics.persistent");

    const profiles: imperative.IProfileLoaded[] = await ZoweExtension.getProfilesCache().fetchAllProfilesByType("cics");
    for (const profilename of persistentStorage.getLoadedCICSProfile()) {
      const existingSessionNode = this.sessionNodes.find((node) => node.label.toString().trim() === profilename);
      const profileToAdd = profiles.find((profile) => profile.name === profilename);

      if (!existingSessionNode && profileToAdd) {
        await this.addSingleSession(profileToAdd);
      }
    }
    this.refresh();
  }

  public addSession(sessionName: string): void {
    const profile: imperative.IProfileLoaded = ZoweExtension.getProfilesCache().loadNamedProfile(sessionName.trim());
    if (profile) {
      this.addSingleSession(profile);
    }
    this.refresh();
  }
}
