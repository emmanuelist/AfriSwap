
;; Title: Mock Fungible Token Contract (mock-token)
;; Summary: Basic implementation of a mintable fungible token with transfer functionality and ownership checks
;; Description: 
;; This contract implements a simple fungible token (FT) with features including:
;; - No maximum supply (infinite minting capability)
;; - Transfer functionality with owner verification
;; - Minting capability for token creation
;; - Standard token metadata views (name, symbol, decimals, balance, supply)
;; - Optional transfer memos with print capability
;; - Basic ownership pattern for transfer authorization
;;
;; The contract serves as a mock token implementation that can be used for:
;; - Testing token interactions in development environments
;; - Prototyping token-based systems
;; - Educational purposes for Clarity smart contract patterns
;; - Foundation for more complex token implementations
;;
;; Key security features:
;; - Transfer requires sender authorization
;; - Immutable contract owner initialization
;; - Clear error codes for authorization failures

(define-constant contract-owner tx-sender) ;; Immutable contract deployer
(define-constant err-owner-only (err u100)) ;; Authorization error code
(define-constant err-not-token-owner (err u101)) ;; Ownership verification error

;; Fungible token declaration with unlimited supply
(define-fungible-token mock-token)

;; Transfer tokens between principals
;; Requires sender to be transaction initiator, includes memo capability
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-token-owner)
        (try! (ft-transfer? mock-token amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

;; Token Metadata Views (SIP-09/10 compliant)

(define-read-only (get-name)
    (ok "Mock Token")
)

(define-read-only (get-symbol)
    (ok "MT")
)

(define-read-only (get-decimals)
    (ok u6)
)

(define-read-only (get-balance (who principal))
    (ok (ft-get-balance mock-token who))
)

(define-read-only (get-total-supply)
    (ok (ft-get-supply mock-token))
)

(define-read-only (get-token-uri)
    (ok none)
)

(define-public (mint (amount uint) (recipient principal))
    (ft-mint? mock-token amount recipient)
)