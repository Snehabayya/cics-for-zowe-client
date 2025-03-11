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

import { commands, TreeView, window } from "vscode";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { ProfileManagement } from "../utils/profileManagement";
import { Gui } from "@zowe/zowe-explorer-api";
import { getResource, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import * as vscode from "vscode";
import { IProfileLoaded } from "@zowe/imperative";

export async function findRelatedZosProfiles(cicsProfile: IProfileLoaded, zosProfiles: IProfileLoaded[]): Promise<IProfileLoaded> {
  const baseForCicsProfile = await ProfileManagement.getProfilesCache().fetchBaseProfile(cicsProfile.name);

  // sort profiles with zosmf ones first to make zosmf the default
  // also filter so we only automatically pick z/os connections that have credentials associated
  zosProfiles = zosProfiles.sort((prof) => (prof.profile.type === "zosmf" ? -1 : 1)).filter((prof) => prof.profile.user);

  // filter out profiles that are not in the same base as the cics profile
  const matchingProfiles: IProfileLoaded[] = [];
  if (baseForCicsProfile) {
    for (const profile of zosProfiles) {
      if (baseForCicsProfile && baseForCicsProfile?.name === (await ProfileManagement.getProfilesCache().fetchBaseProfile(profile.name))?.name) {
        matchingProfiles.push(profile);
      }
    }
  }

  if (matchingProfiles.length > 0) {
    return matchingProfiles[0];
  }

  // we couldn't find anything within a profile group
  // filter down to just profiles that have the same hostname as our cics connection
  const cicsHostProfiles = zosProfiles.filter((profile) => cicsProfile.profile.host === profile.profile.host);

  return cicsHostProfiles[0];
}

function promptUserForProfile(zosProfiles: IProfileLoaded[]): Thenable<string> {
  const profileNames = zosProfiles.map((value) => {
    return value.name;
  });

  if (profileNames.length > 0) {
    const quickPickOptions: vscode.QuickPickOptions = {
      placeHolder: vscode.l10n.t("Select a profile to access the logs"),
      ignoreFocusOut: true,
      canPickMany: false,
    };
    return Gui.showQuickPick(profileNames, quickPickOptions);
  } else {
    return null;
  }
}

export async function getJobIdForRegion(selectedRegion: CICSRegionTree): Promise<string> {
  // when we have a CICSRGN table we have jobid, but not when we have a
  // MAS table. we get either CICSRGN or MAS depending on where we are in the
  // tree. request CICSRGN if jobid isn't available.
  let jobid: string = selectedRegion.region.jobid;
  if (!jobid) {
    let response: ICMCIApiResponse;
    try {
      response = await getResource(selectedRegion.parentSession.getSession(), {
        name: "CICSRegion",
        cicsPlex: selectedRegion.parentPlex.plexName,
        regionName: selectedRegion.region.cicsname,
      });
      jobid = response.response.records.cicsregion.jobid;
    } catch (ex) {
      console.log(ex);
      // unlikely to get here but logging this would be useful in future
    }
  }
  return jobid;
}

export function getShowRegionLogs(treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.showRegionLogs", async (node) => {
    const allSelectedRegions = findSelectedNodes(treeview, CICSRegionTree, node);
    if (!allSelectedRegions || !(allSelectedRegions.length == 1)) {
      await window.showErrorMessage("One CICS region must be selected");
      return;
    }
    const selectedRegion: CICSRegionTree = allSelectedRegions[0];
    const zosProfiles = (await ProfileManagement.getProfilesCache().fetchAllProfiles()).filter(
      (profile) => profile.type === "zosmf" || profile.type === "rse",
    );

    let chosenProfileName: string;

    // find profiles that match by base profile or hostname
    const matchingZosProfiles = await findRelatedZosProfiles(selectedRegion.parentSession.profile, zosProfiles);
    if (matchingZosProfiles) {
      chosenProfileName = matchingZosProfiles.name;
    } else {
      // we couldn't find a matching profile - prompt the user with all zos profiles
      chosenProfileName = await promptUserForProfile(zosProfiles);
      if (chosenProfileName === null) {
        window.showErrorMessage("Could not find any z/OSMF or RSE profiles.");
        return;
      }
    }

    const jobid = await getJobIdForRegion(selectedRegion);
    if (jobid) {
      commands.executeCommand("zowe.jobs.setJobSpool", chosenProfileName, jobid);
    } else {
      window.showErrorMessage(`Could not find Job ID for region ${selectedRegion.region.cicsname}.`);
    }
  });
}
