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

// Test Suite

describe("afriswap Tests", () => {
	// Seed initial balances before each test
	beforeEach(() => {
	  const allAccounts = [alice, bob, charlie];
  
	  // Mint 1B tokens of each type to all test accounts
	  for (const account of allAccounts) {
		// Mint mock-token-1
		const mintResultOne = simnet.callPublicFn(
		  "mock-token",
		  "mint",
		  [Cl.uint(1_000_000_000), Cl.principal(account)],
		  account
		);
		expect(mintResultOne.events.length).toBeGreaterThan(0);
  
		// Mint mock-token-2
		const mintResultTwo = simnet.callPublicFn(
		  "mock-token-2",
		  "mint",
		  [Cl.uint(1_000_000_000), Cl.principal(account)],
		  account
		);
		expect(mintResultTwo.events.length).toBeGreaterThan(0);
	  }
	});
})