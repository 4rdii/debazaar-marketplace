// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title MockERC721
/// @notice A simple ERC721 mock for testing purposes
contract MockERC721 is ERC721 {
    uint256 private _nextTokenId;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    /// @notice Mints a new token to the specified address
    /// @param to The address to mint the token to
    /// @param tokenId The token ID to mint
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    /// @notice Mints a new token with auto-incrementing token ID
    /// @param to The address to mint the token to
    /// @return tokenId The minted token ID
    function mint(address to) external returns (uint256) {
        uint256 tokenId = ++_nextTokenId;
        _mint(to, tokenId);
        return tokenId;
    }

    /// @notice Returns the next available token ID
    /// @return The next token ID that would be minted
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId + 1;
    }
}
