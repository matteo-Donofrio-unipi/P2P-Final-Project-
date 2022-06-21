// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
 
import "./../node_modules/@openzeppelin/contracts/access/Ownable.sol"; 
import "./../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";

    contract newNFT is Ownable, ERC721("NFT", "TRY_NFT"){
        uint8 private tokenId;
        mapping(uint8=>NFT_info) public ownershipRecord;

        struct NFT_info{
            address nft_owner;
            uint8 token_Id;
            string  description_collectible; // collectible description
            uint8 class; //class value
        }

        event NFT_mint(address owner, uint8 token_id, string description_collectible, uint8 class );

        function mintToken(address recipient, string memory description_collectible_given, uint8 given_class) onlyOwner external returns (uint8) {
            //require(owner()!=recipient, "Recipient cannot be the owner of the contract");
            _safeMint(recipient, tokenId);
            ownershipRecord[tokenId]=(NFT_info(recipient,tokenId, description_collectible_given, given_class));
            uint8 token_return = tokenId;

            //emit NFT_mint(recipient,tokenId, description_collectible_given, given_class);

            tokenId = tokenId + 1;
            return token_return;
        }

        function give_to_winner(address owner,address winner, uint8 _tokenId) external {
            super._transfer(owner, winner, _tokenId);
        } 

        function get_NFT_informations(uint8 tokenId_given) public view returns (address, string memory, uint8, uint8){
            return (ownershipRecord[tokenId_given].nft_owner,  ownershipRecord[tokenId_given].description_collectible, ownershipRecord[tokenId_given].class, tokenId_given);
        }

        function get_NFT_desc(uint8 tokenId_given) public view returns (string memory){
            return (ownershipRecord[tokenId_given].description_collectible);
        }



}



/*
 
contract newNFT is NFTokenMetadata, Ownable {

    string public description_collectible; // collectible description
    uint8 public class; //class value

    event NFT_minted(address owner, uint8 class_value, string description);
 
    constructor() {
    }
 
    //_TOKENID IS NFT_ID IN CLASS LOTTERY
    function mint(address _to, uint8 _tokenId, string memory description_collectible_given, uint8 given_class) external onlyOwner {
        super._mint(_to, _tokenId);
        Ownable.owner = _to;
        description_collectible = description_collectible_given;
        class = given_class;
        emit NFT_minted(_to, given_class, description_collectible);
    }


    function give_to_winner(address winner, uint8 _tokenId) external {
        super._transfer(winner, _tokenId);
    } 

    function get_NFT_informations() external view returns (address, string memory, uint8){
        return (Ownable.owner, description_collectible, class);
    }
    
 
}
*/