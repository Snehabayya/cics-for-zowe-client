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

import { TreeItemCollapsibleState } from "vscode";
import { ICICSTreeNode, ICICSTreeOpts, IResourceMeta } from "../doc";
import { Region, ResourceContainer } from "../resources";
import IconBuilder from "../utils/IconBuilder";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { CICSTreeNode } from "./CICSTreeNode";

export class CICSRegionNode extends CICSTreeNode implements ICICSTreeNode {

  constructor(
    private region: Region,
    opts: ICICSTreeOpts,
  ) {
    super(region.getName(), TreeItemCollapsibleState.Collapsed, opts.parentNode, opts.session, opts.profile);

    if (!region.isActive) {
      this.collapsibleState = TreeItemCollapsibleState.None;
    }

    this.refreshIcon();
  }

  refreshIcon(): void {
    this.iconPath = IconBuilder.region(this.region);
  }

  private buildResourceContainerNode<T>(meta: IResourceMeta<T>) {
    return new CICSResourceContainerNode(
      meta.humanReadableName,
      {
        regionName: this.region.getName(),
        parentNode: this,
        profile: this.getProfile(),
        session: this.getSession(),
        cicsplexName: this.region.belongsToPlex ? this.region.plexName : null,
      },
      null, // Indicates this node does NOT represent a specific resource
      {
        resources: new ResourceContainer(meta),
        meta,
      },
    );
  }

  getChildren(): Promise<ICICSTreeNode[]> {
    if (!this.region.isActive) {
      return Promise.resolve(null);
    }

    return Promise.resolve(
      Object.values(this.region.getResourceContainers()).map(
        (resourceContainer) => this.buildResourceContainerNode(resourceContainer.getMeta())
      )
    );

  }

  getSessionNode(): ICICSTreeNode {
    return this.getParent().getSessionNode();
  }
}
