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
import { ICICSTreeNode, ICICSTreeOpts } from "../doc";
import { CICSplex } from "../resources";
import IconBuilder from "../utils/IconBuilder";
import { CICSRegionNode } from "./CICSRegionNode";
import { CICSTreeNode } from "./CICSTreeNode";

export class CICSPlexNode extends CICSTreeNode implements ICICSTreeNode {
  constructor(
    private cicsplex: CICSplex,
    opts: ICICSTreeOpts
  ) {
    super(cicsplex.getName(), TreeItemCollapsibleState.Collapsed, opts.parentNode, opts.session, opts.profile);

    this.refreshIcon();
  }

  refreshIcon(): void {
    this.iconPath = IconBuilder.plex(this.cicsplex);
  }

  getCICSplex(): CICSplex {
    return this.cicsplex;
  }

  async getChildren(): Promise<ICICSTreeNode[]> {
    const regions = await this.cicsplex.getRegions(this.getSession());
    this.children = regions.map(
      (region) => new CICSRegionNode(
        region,
        { parentNode: this, session: this.getSession(), profile: this.getProfile() },
      )
    );
    return this.children;
  }

  getSessionNode(): ICICSTreeNode {
    return this.getParent();
  }
}
