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

import { ITestEnvironment, TestEnvironment } from "@zowe/cli-test-utils";
import { Session } from "@zowe/imperative";
import { IProgramParms, defineProgram, deleteProgram } from "../../../src";
import { ITestPropertiesSchema } from "../../__src__/ITestPropertiesSchema";
import { generateRandomAlphaNumericString } from "../../__src__/TestUtils";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let regionName: string;
let csdGroup: string;
let session: Session;

describe("CICS Delete program", () => {
  beforeAll(async () => {
    testEnvironment = await TestEnvironment.setUp({
      testName: "cics_cmci_delete_program",
      tempProfileTypes: ["cics"],
    });
    csdGroup = testEnvironment.systemTestProperties.cmci.csdGroup;
    regionName = testEnvironment.systemTestProperties.cmci.regionName;
    const cicsProperties = testEnvironment.systemTestProperties.cics;

    session = new Session({
      user: cicsProperties.user,
      password: cicsProperties.password,
      hostname: cicsProperties.host,
      port: cicsProperties.port,
      type: "basic",
      rejectUnauthorized: cicsProperties.rejectUnauthorized || false,
      protocol: (cicsProperties.protocol as any) || "https",
    });
  });

  afterAll(async () => {
    await TestEnvironment.cleanUp(testEnvironment);
  });

  const options: IProgramParms = {} as any;

  it("should delete a program from CICS", async () => {
    let error;
    let response;

    const programNameSuffixLength = 4;
    const programName = "AAAA" + generateRandomAlphaNumericString(programNameSuffixLength);

    options.name = programName;
    options.csdGroup = csdGroup;
    options.regionName = regionName;

    try {
      await defineProgram(session, options);
      response = await deleteProgram(session, options);
    } catch (err) {
      error = err;
    }

    expect(error).toBeFalsy();
    expect(response).toBeTruthy();
    expect(response.response.resultsummary.api_response1).toBe("1024");
  });

  it("should fail to delete a program from CICS with invalid CICS region", async () => {
    let error;
    let response;

    const programNameSuffixLength = 4;
    const programName = "AAAA" + generateRandomAlphaNumericString(programNameSuffixLength);

    options.name = programName;
    options.csdGroup = csdGroup;
    options.regionName = "FAKE";

    try {
      response = await deleteProgram(session, options);
    } catch (err) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(response).toBeFalsy();
    expect(error.message).toContain("Did not receive the expected response from CMCI REST API");
    expect(error.message).toContain("INVALIDPARM");
  });
});
