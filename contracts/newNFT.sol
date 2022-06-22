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

        //mint a new token and store locally its information
        function mintToken(address recipient, string memory description_collectible_given, uint8 given_class) onlyOwner external returns (uint8) {
            _safeMint(recipient, tokenId);
            ownershipRecord[tokenId]=(NFT_info(recipient,tokenId, description_collectible_given, given_class));
            
            uint8 token_return = tokenId; //save the token_id of the actual NFT minted, then return it

            tokenId = tokenId + 1;
            return token_return;
        }

        //trasnfer the ownership to a new owner
        function give_to_winner(address owner,address winner, uint8 _tokenId) external {
            super._transfer(owner, winner, _tokenId); //change the NFT owner class attribute
            ownershipRecord[_tokenId].nft_owner=winner; //change the NFT owner local attribute
        } 

        //return all the info about a NFT identified by its token_id
        function get_NFT_informations(uint8 tokenId_given) public view returns (address, string memory, uint8, uint8){
            return (ownershipRecord[tokenId_given].nft_owner,  ownershipRecord[tokenId_given].description_collectible, ownershipRecord[tokenId_given].class, tokenId_given);
        }

        //return the string description about a NFT identified by its token_id
        function get_NFT_desc(uint8 tokenId_given) public view returns (string memory){
            return (ownershipRecord[tokenId_given].description_collectible);
        }



}
