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

import { ExtensionContext } from "vscode";
import { CICSTree } from "./trees";
import ZoweExtension from "./utils/ZoweExtension";
import ProgramCommands from "./commands/ProgramCommands";


export async function activate(context: ExtensionContext) {

  if (!ZoweExtension.validAPI()) {
    return;
  }

  const treeDataProvider = new CICSTree();

  try {
    await ZoweExtension.registerCICSProfiles();

    ZoweExtension.getAPI().onProfilesUpdate(async () => {
      await treeDataProvider.loadProfileByPersistedProfile();
    });

  } catch (error) {
    return;
  }

  await treeDataProvider.loadProfileByPersistedProfile();

  context.subscriptions.concat([
    ...ProgramCommands.getCommands(treeDataProvider)
  ]);

}

