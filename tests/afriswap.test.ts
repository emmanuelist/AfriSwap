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

  // Core Functionality Tests

  // Test 1: Verify pool creation with valid parameters
  it("allows pool creation", () => {
    const { result, events } = createPool();
    expect(result).toBeOk(Cl.bool(true)); // Should return success
    expect(events.length).toBe(1); // Should emit 1 event
  });

  // Test 2: Prevent duplicate pool creation
  it("disallows creation of same pool twice", () => {
    const { result: result1 } = createPool();
    expect(result1).toBeOk(Cl.bool(true)); // First creation succeeds

    const { result: result2 } = createPool();
    expect(result2).toBeErr(Cl.uint(200)); // Second creation fails with code 200
  });

  // Test 3: Validate initial liquidity addition with any ratio
  it("adds initial liquidity in whatever ratio", () => {
    const createPoolRes = createPool();
    expect(createPoolRes.result).toBeOk(Cl.bool(true));

    const addLiqRes = addLiquidity(alice, 1000000, 500000);
    expect(addLiqRes.result).toBeOk(Cl.bool(true)); // Success response
    expect(addLiqRes.events.length).toBe(3); // 2 transfers + 1 mint event
  });

  // Test 4: Enforce ratio maintenance for subsequent liquidity additions
  it("requires n+1 add liquidity calls to maintain ratio", () => {
    const createPoolRes = createPool();
    expect(createPoolRes.result).toBeOk(Cl.bool(true));

    // Initial liquidity
    const addLiqRes = addLiquidity(alice, 1000000, 500000);
    expect(addLiqRes.result).toBeOk(Cl.bool(true));

    // Subsequent addition with ratio enforcement
    const secondAddLiqRes = addLiquidity(alice, 5000, 10000000);
    expect(secondAddLiqRes.result).toBeOk(Cl.bool(true));

    // Verify token transfers match ratio
    expect(secondAddLiqRes.events[0].data.amount).toBe("5000"); // Token 0 deposited
    expect(secondAddLiqRes.events[1].data.amount).toBe("2500"); // Token 1 deposited (50% ratio)
  });

  // Test 5: Validate liquidity removal with minimum reserve
  it("allows removing liquidity except minimum liquidity", () => {
    createPool();
    addLiquidity(alice, 1000000, 500000);

    // Get liquidity position
    const { result: poolId } = getPoolId();
    const aliceLiquidity = simnet.callReadOnlyFn(
      "afriswap",
      "get-position-liquidity",
      [poolId, Cl.principal(alice)],
      alice
    );
    expect(aliceLiquidity.result).toBeOk(Cl.uint(706106)); // Verify liquidity amount

    // Attempt full withdrawal
    const { result, events } = removeLiquidity(alice, 706106);
    expect(result).toBeOk(Cl.bool(true));

    // Verify withdrawn amounts (minus minimum reserve)
    const tokenOneWithdrawn = parseInt(events[0].data.amount);
    const tokenTwoWithdrawn = parseInt(events[1].data.amount);
    expect(tokenOneWithdrawn).toBe(998585); // 1M - 1,415 reserve
    expect(tokenTwoWithdrawn).toBe(499292); // 500K - 708 reserve
  });

  // Test 6: Validate swap functionality
  it("should allow for swaps", () => {
    createPool();
    addLiquidity(alice, 1000000, 500000);

    // Execute swap (token0 -> token1)
    const { result, events } = swap(alice, 100000, true);
    expect(result).toBeOk(Cl.bool(true));

    // Verify swap amounts
    expect(events[0].data.amount).toBe("100000"); // Input amount
    expect(events[1].data.amount).toBe("43183"); // Output amount
  });

  // Test 7: Verify fee distribution to liquidity providers
  it("should distribute fees earned amongst LPs", () => {
    createPool();
    addLiquidity(alice, 1000000, 500000);

    // Record pre-swap balances
    const withdrawableTokenOnePreSwap = 998585;
    const withdrawableTokenTwoPreSwap = 499292;

    // Generate fees through swap
    swap(alice, 100000, true);

    // Withdraw liquidity
    const { result, events } = removeLiquidity(alice, 706106);
    expect(result).toBeOk(Cl.bool(true));

    // Verify fee impact
    const tokenOneWithdrawn = parseInt(events[0].data.amount);
    const tokenTwoWithdrawn = parseInt(events[1].data.amount);
    expect(tokenOneWithdrawn).toBeGreaterThan(withdrawableTokenOnePreSwap); // Fees in token0
    expect(tokenTwoWithdrawn).toBeLessThan(withdrawableTokenTwoPreSwap); // Reduced token1 due to swap
  });
});
