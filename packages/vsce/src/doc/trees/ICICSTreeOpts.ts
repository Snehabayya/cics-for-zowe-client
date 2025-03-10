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
import { CICSSession } from "../../resources/CICSSession";
import { ICICSTreeNode } from "./ICICSTreeNode";

export interface ICICSTreeOpts {
  label?: string;
  collapsibleState?: TreeItemCollapsibleState;
  parentNode?: ICICSTreeNode;
  session?: CICSSession;
  profile?: imperative.IProfileLoaded;
}
