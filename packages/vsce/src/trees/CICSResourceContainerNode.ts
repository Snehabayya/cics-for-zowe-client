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

import { imperative } from "@zowe/zowe-explorer-api";
import { TreeItemCollapsibleState, TreeItemLabel } from "vscode";
import { IChildResources, ICICSTreeNode, IContainedResource, IResource } from "../doc";
import { CICSSession, ResourceContainer } from "../resources";
import IconBuilder from "../utils/IconBuilder";
import { CICSRegionNode } from "./CICSRegionNode";
import { CICSTreeNode } from "./CICSTreeNode";
import { CICSSessionNode } from "./CICSSessionNode";

export class CICSResourceContainerNode<T extends IResource> extends CICSTreeNode implements ICICSTreeNode {
  regionName: string;
  cicsplexName: string;

  constructor(
    label: string | TreeItemLabel,
    opts: {
      parentNode: CICSRegionNode | CICSResourceContainerNode<IResource>;
      session: CICSSession;
      profile: imperative.IProfileLoaded;
      regionName: string;
      cicsplexName: string;
    },
    private containedResource?: IContainedResource<T>,
    private childResource?: IChildResources<T>,
  ) {
    super(
      label,
      childResource?.meta ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
      opts.parentNode, opts.session, opts.profile
    );

    this.regionName = opts.regionName;
    this.cicsplexName = opts.cicsplexName;

    this.contextValue = `${this.label}`;
    if (this.containedResource?.meta) {
      this.contextValue = this.containedResource.meta.getContext(this.containedResource.resource);
    }

    this.refreshIcon();
  }

  refreshIcon(folderOpen: boolean = false): void {
    this.iconPath = this.containedResource?.meta ?
      IconBuilder.resource(this.containedResource) :
      IconBuilder.folder(folderOpen);
  }

  async getChildren(): Promise<ICICSTreeNode[]> {

    if (!this.childResource?.meta) {
      return null;
    }

    const resources = await this.childResource.resources.loadResources(
      this.getSession(),
      this.regionName,
      this.cicsplexName,
      await this.childResource.meta.getDefaultFilter(this.containedResource?.resource.attributes)
    );

    this.children = resources.map(
      (resource) =>
        new CICSResourceContainerNode(
          this.childResource.meta.getLabel(resource),
          {
            parentNode: this,
            cicsplexName: this.cicsplexName,
            regionName: this.regionName,
            profile: this.getProfile(),
            session: this.getSession(),
          },
          {
            resource,
            meta: this.childResource.meta,
          },
          {
            meta: this.childResource.meta.childType,
            resources: this.childResource.meta.childType ? new ResourceContainer(this.childResource.meta.childType, resource) : null,
          },
        )
    );

    this.refreshIcon(true);

    return this.children;
  }

  getSessionNode(): ICICSTreeNode {
    return this.getParent().getSessionNode();
  }

  getContainerResource(): IContainedResource<T> {
    return this.containedResource;
  }
}
