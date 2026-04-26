// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title BetTicket
 * @dev NFT ERC-721 que representa bilhetes de aposta do MonkeyBet.
 *      Metadados 100% on-chain com SVG embutido em base64.
 */
contract BetTicket is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;

    struct Ticket {
        uint256 eventId;
        uint256 amount;
        address bettor;
        bool settled;
        bool won;
        string eventName;
        string odd;
    }

    mapping(uint256 => Ticket) public tickets;
    mapping(address => bool) public authorizedMinters;

    event TicketMinted(uint256 indexed tokenId, address indexed bettor, uint256 eventId, uint256 amount);
    event TicketSettled(uint256 indexed tokenId, bool won);

    modifier onlyAuthorized() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "BetTicket: not authorized");
        _;
    }

    constructor() ERC721("MonkeyBet Ticket", "MBET") Ownable(msg.sender) {}

    /// @notice Autoriza um endereço a mintar bilhetes
    function authorize(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
    }

    /// @notice Revoga autorização de mint
    function revoke(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
    }

    /**
     * @notice Minta um bilhete NFT de aposta
     * @param to       Endereço do apostador
     * @param eventId  ID do evento
     * @param amount   Valor apostado (em wei)
     * @param eventName Nome do evento
     * @param odd      Odd do evento (ex: "2.5x")
     */
    function mintTicket(
        address to,
        uint256 eventId,
        uint256 amount,
        string calldata eventName,
        string calldata odd
    ) external onlyAuthorized returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        tickets[tokenId] = Ticket({
            eventId: eventId,
            amount: amount,
            bettor: to,
            settled: false,
            won: false,
            eventName: eventName,
            odd: odd
        });

        _setTokenURI(tokenId, _buildTokenURI(tokenId));

        emit TicketMinted(tokenId, to, eventId, amount);
        return tokenId;
    }

    /**
     * @notice Resolve o resultado de um bilhete (owner apenas)
     * @param tokenId ID do token
     * @param won     true = ganhou, false = perdeu
     */
    function settleTicket(uint256 tokenId, bool won) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "BetTicket: nonexistent token");
        require(!tickets[tokenId].settled, "BetTicket: already settled");

        tickets[tokenId].settled = true;
        tickets[tokenId].won = won;
        _setTokenURI(tokenId, _buildTokenURI(tokenId));

        emit TicketSettled(tokenId, won);
    }

    /// @notice Retorna total de tickets mintados
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    // ─── Metadados on-chain ───────────────────────────────────────────────────

    function _buildTokenURI(uint256 tokenId) internal view returns (string memory) {
        Ticket memory t = tickets[tokenId];
        string memory status = !t.settled ? "PENDENTE" : (t.won ? "GANHOU" : "PERDEU");

        bytes memory json = abi.encodePacked(
            '{"name":"MonkeyBet Ticket #', tokenId.toString(),
            '","description":"Bilhete de aposta on-chain do Bet do Macaquinho","attributes":[',
            '{"trait_type":"Evento","value":"', t.eventName, '"},',
            '{"trait_type":"Odd","value":"', t.odd, '"},',
            '{"trait_type":"Status","value":"', status, '"}',
            '],"image":"data:image/svg+xml;base64,', _buildSVG(tokenId, status, t), '"}'
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    function _buildSVG(uint256 tokenId, string memory status, Ticket memory t)
        internal
        pure
        returns (string memory)
    {
        string memory color = _statusColor(status);

        bytes memory svg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="350" height="210" viewBox="0 0 350 210">',
            '<rect width="350" height="210" rx="14" fill="#0f0f1a"/>',
            '<rect x="8" y="8" width="334" height="194" rx="10" fill="#1a1a2e" stroke="', color, '" stroke-width="2"/>',
            '<text x="175" y="48" font-family="Arial" font-size="22" fill="', color,
            '" text-anchor="middle" font-weight="bold">&#x1F412; MonkeyBet</text>',
            '<text x="175" y="78" font-family="Arial" font-size="11" fill="#aaa" text-anchor="middle">',
            t.eventName,
            '</text>',
            '<text x="175" y="108" font-family="Arial" font-size="16" fill="#fff" text-anchor="middle">Odd: ', t.odd, '</text>',
            '<text x="175" y="135" font-family="Arial" font-size="11" fill="#666" text-anchor="middle">Ticket #', tokenId.toString(), '</text>',
            '<rect x="90" y="152" width="170" height="30" rx="8" fill="', color, '"/>',
            '<text x="175" y="173" font-family="Arial" font-size="14" fill="#000" text-anchor="middle" font-weight="bold">', status, '</text>',
            '</svg>'
        );

        return Base64.encode(svg);
    }

    function _statusColor(string memory status) internal pure returns (string memory) {
        bytes32 h = keccak256(bytes(status));
        if (h == keccak256(bytes("GANHOU"))) return "#22c55e";
        if (h == keccak256(bytes("PERDEU"))) return "#ef4444";
        return "#f59e0b";
    }

    // ─── Overrides obrigatórios ───────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
