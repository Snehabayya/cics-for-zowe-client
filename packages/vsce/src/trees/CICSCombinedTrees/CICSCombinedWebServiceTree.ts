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

import { ProgressLocation, TreeItem, TreeItemCollapsibleState, window, workspace } from "vscode";
import { toEscapedCriteriaString } from "../../utils/filterUtils";
import { getFolderIcon } from "../../utils/iconUtils";
import { ProfileManagement } from "../../utils/profileManagement";
import { CICSPlexTree } from "../CICSPlexTree";
import { CICSRegionTree } from "../CICSRegionTree";
import { CICSRegionsContainer } from "../CICSRegionsContainer";
import { CICSTree } from "../CICSTree";
import { TextTreeItem } from "../treeItems/utils/TextTreeItem";
import { ViewMore } from "../treeItems/utils/ViewMore";
import { CICSWebServiceTreeItem } from "../treeItems/CICSWebServiceTreeItem";

export class CICSCombinedWebServiceTree extends TreeItem {
  children: (CICSWebServiceTreeItem | ViewMore)[] | [TextTreeItem] | null;
  parentPlex: CICSPlexTree;
  activeFilter: string | undefined;
  currentCount: number;
  incrementCount: number;
  constant: string;

  constructor(
    parentPlex: CICSPlexTree,
    public iconPath = getFolderIcon(false)
  ) {
    super("All Web Services", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicscombinedwebservicetree.`;
    this.parentPlex = parentPlex;
    this.children = [new TextTreeItem("Use the search button to display web services", "applyfiltertext.")];
    this.activeFilter = undefined;
    this.currentCount = 0;
    this.incrementCount = +`${workspace.getConfiguration().get("zowe.cics.allWebServices.recordCountIncrement")}`;
    this.constant = "CICSWebService";
  }

  public async loadContents(tree: CICSTree) {
    await window.withProgress(
      {
        title: "Loading Web Services",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (_, token) => {
        token.onCancellationRequested(() => {});
        try {
          let criteria;
          if (this.activeFilter) {
            criteria = toEscapedCriteriaString(this.activeFilter, "NAME");
          }
          let count;
          const cacheTokenInfo = await ProfileManagement.generateCacheToken(
            this.parentPlex.getProfile(),
            this.getSession(),
            this.parentPlex.getPlexName(),
            this.constant,
            criteria,
            this.getParent().getGroupName()
          );
          if (cacheTokenInfo) {
            const recordsCount = cacheTokenInfo.recordCount;
            if (recordsCount) {
              let allWebServices;
              if (recordsCount <= this.incrementCount) {
                allWebServices = await ProfileManagement.getCachedResources(
                  this.parentPlex.getProfile(),
                  this.getSession(),
                  cacheTokenInfo.cacheToken,
                  this.constant,
                  1,
                  recordsCount
                );
              } else {
                allWebServices = await ProfileManagement.getCachedResources(
                  this.parentPlex.getProfile(),
                  this.getSession(),
                  cacheTokenInfo.cacheToken,
                  this.constant,
                  1,
                  this.incrementCount
                );
                count = recordsCount;
              }
              this.addWebServicesUtil([], allWebServices, count);
              this.iconPath = getFolderIcon(true);
              tree._onDidChangeTreeData.fire(undefined);
            } else {
              this.children = [];
              this.iconPath = getFolderIcon(true);
              tree._onDidChangeTreeData.fire(undefined);
              window.showInformationMessage(`No Web Services found`);
              this.label = `All Web Services${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${recordsCount}]`;
            }
          }
        } catch (error) {
          await window.showErrorMessage(
            `Something went wrong when fetching web services - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
              /(\\n\t|\\n|\\t)/gm,
              " "
            )}`
          );
        }
      }
    );
  }

  public addWebServicesUtil(newChildren: (CICSWebServiceTreeItem | ViewMore)[], allWebServices: any, count: number | undefined) {
    for (const webservice of allWebServices) {
      // Regions container must exist if all web services tree exists
      const regionsContainer = this.parentPlex.children.filter((child) => child instanceof CICSRegionsContainer)?.[0];
      if (regionsContainer == null) {
        continue;
      }
      const parentRegion = regionsContainer
        .getChildren()!
        .filter((child) => child instanceof CICSRegionTree && child.getRegionName() === webservice.eyu_cicsname)?.[0] as CICSRegionTree;
      const webserviceTree = new CICSWebServiceTreeItem(webservice, parentRegion, this);
      webserviceTree.setLabel(webserviceTree.label.toString().replace(webservice.name, `${webservice.name} (${webservice.eyu_cicsname})`));
      newChildren.push(webserviceTree);
    }
    if (!count) {
      count = newChildren.length;
    }
    this.currentCount = newChildren.length;
    this.label = `All Web Services ${this.activeFilter ? `(${this.activeFilter}) ` : " "}[${this.currentCount} of ${count}]`;
    if (count !== this.currentCount) {
      newChildren.push(new ViewMore(this, Math.min(this.incrementCount, count - this.currentCount)));
    }
    this.children = newChildren;
  }

  public async addMoreCachedResources(tree: CICSTree) {
    await window.withProgress(
      {
        title: "Loading more pipelins",
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async () => {
        let criteria;
        if (this.activeFilter) {
          criteria = toEscapedCriteriaString(this.activeFilter, "NAME");
        }
        const cacheTokenInfo = await ProfileManagement.generateCacheToken(
          this.parentPlex.getProfile(),
          this.getSession(),
          this.parentPlex.getPlexName(),
          this.constant,
          criteria,
          this.getParent().getGroupName()
        );
        if (cacheTokenInfo) {
          // record count may have updated
          const recordsCount = cacheTokenInfo.recordCount;
          const count = recordsCount;
          const allWebServices = await ProfileManagement.getCachedResources(
            this.parentPlex.getProfile(),
            this.getSession(),
            cacheTokenInfo.cacheToken,
            this.constant,
            this.currentCount + 1,
            this.incrementCount
          );
          if (allWebServices) {
            // @ts-ignore
            this.addWebServicesUtil(
              (this.getChildren()?.filter((child) => child instanceof CICSWebServiceTreeItem) ?? []) as CICSWebServiceTreeItem[],
              allWebServices,
              count
            );
            tree._onDidChangeTreeData.fire(undefined);
          }
        }
      }
    );
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.label = `All Web Services`;
    this.contextValue = `cicscombinedwebservicetree.unfiltered`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.label = `All Web Services (${this.activeFilter})`;
    this.contextValue = `cicscombinedwebservicetree.filtered`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getChildren() {
    return this.children ? this.children.filter((child) => !(child instanceof TextTreeItem)) : [];
  }

  public getActiveFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.parentPlex;
  }

  public getSession() {
    return this.getParent().getSession();
  }
}
