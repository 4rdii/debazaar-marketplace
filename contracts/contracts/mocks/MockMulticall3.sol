// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title MockMulticall3
/// @notice A simplified Multicall3 implementation for testing purposes
/// @dev Mimics Uniswap's Multicall3 at 0xcA11bde05977b3631167028862bE2a173976CA11
contract MockMulticall3 {
    struct Call3 {
        address target;
        bool allowFailure;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    /// @notice Executes multiple calls in a single transaction
    /// @param calls Array of calls to execute
    /// @return results Array of results for each call
    function aggregate3(Call3[] calldata calls) external payable returns (Result[] memory results) {
        results = new Result[](calls.length);
        
        for (uint256 i = 0; i < calls.length; i++) {
            if (calls[i].allowFailure) {
                // Allow failure - catch revert and continue
                (bool success, bytes memory returnData) = calls[i].target.call(calls[i].callData);
                results[i] = Result(success, returnData);
            } else {
                // Don't allow failure - revert on any failure
                (bool success, bytes memory returnData) = calls[i].target.call(calls[i].callData);
                require(success, "Multicall3: call failed");
                results[i] = Result(success, returnData);
            }
        }
    }

    /// @notice Executes multiple calls in a single transaction (view version)
    /// @param calls Array of calls to execute
    /// @return results Array of results for each call
    function aggregate3View(Call3[] calldata calls) external view returns (Result[] memory results) {
        results = new Result[](calls.length);
        
        for (uint256 i = 0; i < calls.length; i++) {
            if (calls[i].allowFailure) {
                // Allow failure - catch revert and continue
                (bool success, bytes memory returnData) = calls[i].target.staticcall(calls[i].callData);
                results[i] = Result(success, returnData);
            } else {
                // Don't allow failure - revert on any failure
                (bool success, bytes memory returnData) = calls[i].target.staticcall(calls[i].callData);
                require(success, "Multicall3: call failed");
                results[i] = Result(success, returnData);
            }
        }
    }
}
