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

import { EventEmitter, ProviderResult, TreeItem } from "vscode";
import { ICICSTreeNode } from "../doc";

export class CICSTreeProvider<T extends ICICSTreeNode> {
  public mOnDidChangeTreeData: EventEmitter<T | undefined | null | void> = new EventEmitter();
  public readonly onDidChangeTreeData = this.mOnDidChangeTreeData.event;

  getTreeItem(element: ICICSTreeNode): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getParent(element: T): ProviderResult<T> {
    return element.getParent() as T;
  }

  refresh(element: T = null): void {
    this.mOnDidChangeTreeData.fire(element);
  }
}
