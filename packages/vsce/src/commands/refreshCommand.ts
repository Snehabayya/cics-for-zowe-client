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

import { commands, ProgressLocation, window } from "vscode";
import { CICSTree } from "../trees/CICSTree";

export function getRefreshCommand(tree: CICSTree) {
  return commands.registerCommand("cics-extension-for-zowe.refreshTree", async () => {
    try {
      await window.withProgress(
        {
          title: "Refreshing",
          location: ProgressLocation.Notification,
          cancellable: false,
        },
        async () => {
          await tree.refreshLoadedProfiles();
        }
      );
    } finally {
      tree._onDidChangeTreeData.fire(undefined);
      window.showInformationMessage("Refreshed");
    }
  });
}
