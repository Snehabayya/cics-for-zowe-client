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
import { TreeItemCollapsibleState } from "vscode";
import { ICICSTreeNode } from "../doc";
import { CICSplex, CICSSession, Region } from "../resources";
import IconBuilder from "../utils/IconBuilder";
import { CICSRegionNode } from "./CICSRegionNode";
import { CICSTree } from "./CICSTree";
import { CICSTreeNode } from "./CICSTreeNode";
import { CICSPlexNode } from "./CICSplexNode";

export class CICSSessionNode extends CICSTreeNode implements ICICSTreeNode {

  tree: CICSTree;
  topology: {
    cicsplexes: CICSplex[];
    regions: Region[];
  };

  constructor({
    profile, session, tree
  }: { profile: imperative.IProfileLoaded; session: CICSSession; tree: CICSTree; }) {

    super(profile.name, TreeItemCollapsibleState.Collapsed, null, session, profile);
    this.tree = tree;

    // if (this.session.cicsplexName && this.session.regionName) {
    //   this.label += ` (${this.session.cicsplexName}/${this.session.regionName})`;
    // } else if (this.session.cicsplexName) {
    //   this.label += ` (${this.session.cicsplexName})`;
    // } else if (this.session.regionName) {
    //   this.label += ` (${this.session.regionName})`;
    // }

    this.refreshIcon();
  }

  refreshIcon() {
    this.iconPath = IconBuilder.session(this.session);
  }

  async prefetch() {
    this.topology = await this.session.getTopology();
    this.session.setVerified(true);
  }

  async getChildren(): Promise<ICICSTreeNode[]> {

    if (!this.topology) {
      return Promise.resolve([]);
    }

    // this.topology = await this.session.getTopology();

    /**
     *
     * >1 region, plex is 0 or 1
     *    load region nodes under session
     * 1 region, plex is 0 or 1
     *    load region children directly under session?
     * >1 plex,
     *    load plex nodes under session
     *
     */

    if (this.topology.regions.length > 1 && this.topology.cicsplexes.length <= 1) {
      this.children = this.topology.regions.map(
        (region) =>
          new CICSRegionNode(
            region,
            {
              parentNode: this,
              session: this.getSession(),
              profile: this.getProfile(),
            },
          )
      );
    } else if (this.topology.regions.length === 1 && this.topology.cicsplexes.length <= 1) {
      const region = new CICSRegionNode(
        this.topology.regions[0],
        {
          parentNode: this,
          session: this.getSession(),
          profile: this.getProfile(),
        },
      );
      this.children = await region.getChildren();
    } else {
      this.children = this.topology.cicsplexes.map(
        (plex) =>
          new CICSPlexNode(plex, {
            parentNode: this,
            session: this.getSession(),
            profile: this.getProfile(),
          })
      );
    }

    return this.children;
  }

  getSessionNode(): CICSSessionNode {
    return this;
  }
}
