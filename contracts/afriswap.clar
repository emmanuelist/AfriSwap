
;; Title: AfriSwap - Decentralized Exchange Protocol
;;
;; Summary: AfriSwap is a decentralized exchange (DEX) protocol built on the Stacks blockchain,
;; enabling seamless token swaps and liquidity provision with minimal fees.
;;
;; Description:
;; AfriSwap allows users to create liquidity pools, add/remove liquidity, and swap tokens in a decentralized manner.
;; The protocol ensures efficient price discovery, low slippage, and fair fee distribution.
;;
;; Key features include:
;; - Creation of liquidity pools with customizable fees.
;; - Addition and removal of liquidity with proportional token allocation.
;; - Token swaps with minimal slippage and competitive fees.
;; - Secure and transparent smart contract operations.
;;
;; AfriSwap is designed to empower users with full control over their assets while maintaining a high level of security and efficiency.

;; This contract is built with security and efficiency in mind, ensuring a seamless trading experience for users.

;; constants

(define-constant MINIMUM_LIQUIDITY u1000) ;; minimum liquidity that must exist in a pool
(define-constant THIS_CONTRACT (as-contract tx-sender)) ;; this contract
(define-constant FEES_DENOM u10000) ;; fees denominator

;; errors
(define-constant ERR_POOL_ALREADY_EXISTS (err u200)) ;; pool already exists
(define-constant ERR_INCORRECT_TOKEN_ORDERING (err u201)) ;; incorrect token ordering (invalid sorting)
(define-constant ERR_INSUFFICIENT_LIQUIDITY_MINTED (err u202)) ;; insufficient liquidity amounts being added
(define-constant ERR_INSUFFICIENT_LIQUIDITY_OWNED (err u203)) ;; not enough liquidity owned to withdraw the requested amount
(define-constant ERR_INSUFFICIENT_LIQUIDITY_BURNED (err u204)) ;; insufficient liquidity amounts being removed
(define-constant ERR_INSUFFICIENT_INPUT_AMOUNT (err u205)) ;; insufficient input token amount for swap
(define-constant ERR_INSUFFICIENT_LIQUIDITY_FOR_SWAP (err u206)) ;; insufficient liquidity in pool for swap
(define-constant ERR_INSUFFICIENT_1_AMOUNT (err u207)) ;; insufficient amount of token 1 for swap
(define-constant ERR_INSUFFICIENT_0_AMOUNT (err u208)) ;; insufficient amount of token 0 for swap

;; mappings
(define-map pools
    (buff 20) ;; Pool ID (hash of Token0 + Token1 + Fee)
    { 
        token-0: principal,
        token-1: principal,
        fee: uint,

        liquidity: uint,
        balance-0: uint,
        balance-1: uint
    }
)

(define-map positions 
    { 
        pool-id: (buff 20),
        owner: principal
    } 
    { 
        liquidity: uint
    }
)

;; create-pool
;; Creates a new pool with the given token-0, token-1, and fee
;; Ensures that a pool with these two tokens and given fee amount does not already exist
(define-public (create-pool (token-0 <ft-trait>) (token-1 <ft-trait>) (fee uint)) 
    (let (
        ;; Create a pool-info tuple with the information
        (pool-info {
            token-0: token-0,
            token-1: token-1,
            fee: fee
        })
        ;; Compute the pool ID
        (pool-id (get-pool-id pool-info))
        ;; Ensure this Pool ID doesn't already exist in the `pools` map
        (pool-does-not-exist (is-none (map-get? pools pool-id)))

        ;; Convert the <ft-trait> values into principals
        (token-0-principal (contract-of token-0))
        (token-1-principal (contract-of token-1))

        ;; Prepare the pool-data tuple
        (pool-data {
            token-0: token-0-principal,
            token-1: token-1-principal,
            fee: (get fee pool-info),
            liquidity: u0, ;; initially, liquidity is 0
            balance-0: u0, ;; initially, balance-0 (x) is 0
            balance-1: u0 ;; initially, balance-1 (y) is 0
        })
    ) 

    ;; If pool does already exist, throw an error
    (asserts! pool-does-not-exist ERR_POOL_ALREADY_EXISTS)
    ;; If the token-0 principal is not "less than" the token-1 principal, throw an error
    (asserts! (is-ok (correct-token-ordering token-0-principal token-1-principal)) ERR_INCORRECT_TOKEN_ORDERING)
    
    ;; Update the `pools` map with the new pool data
    (map-set pools pool-id pool-data)
    (print { action: "create-pool", data: pool-data})
    (ok true)
    )
)