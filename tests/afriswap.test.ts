import { Cl } from "@stacks/transactions";
import { beforeEach, describe, expect, it } from "vitest";


// Test Setup


// Get simulated network accounts
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;
const charlie = accounts.get("wallet_3")!;

// Define contract principals for mock tokens
const mockTokenOne = Cl.contractPrincipal(deployer, "mock-token");
const mockTokenTwo = Cl.contractPrincipal(deployer, "mock-token-2");
