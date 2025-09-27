import React from "react";
import { yellow } from "@material-ui/core/colors";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";
import Grid from "@material-ui/core/Grid";
import styled from "styled-components";

export interface MintedItem {
  mint: string;
  signature: string;
}

export const Action = styled.button`
  font-size: 1.2em;
  padding: 15px 20px;
  font-weight: bold;
  line-height: 0.5px;
  color: #000;
  background: #fff;
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%),
    0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  border: 0;
  border-radius: 5px;
  box-sizing: border-box;
  font-family: "Patrick Hand", cursive;
  vertical-align: middle;
  transition: all linear 0.3s;

  :hover {
    border: none;
    outline: none !important;
    background: #d09a69;
  }
  :not(disabled) {
    cursor: pointer;
  }

  :not(disabled):hover {
    outline: 1px solid var(--title-text-color);
  }
`;
export default function NftsModal({
  mintedItems,
  setMintedItems,
  openOnSolscan
}: {
  mintedItems: (MintedItem | any)[];
  setMintedItems: any;
  openOnSolscan: (key: string) => void
}) {
  const handleClose = () => {
    setMintedItems([]);
  };

  const openTransaction = (signature: Uint8Array) => {
    const bs58 = require('bs58');
    const sigBase58 = bs58.encode(signature);
    window.open(`https://solscan.io/tx/${sigBase58}`, '_blank');
  };

  return (
    <Dialog
      open={!!mintedItems.length}
      keepMounted
      onClose={handleClose}
      aria-labelledby="alert-dialog-slide-title"
      aria-describedby="alert-dialog-slide-description"
      maxWidth={"md"}
      PaperProps={{
        style: {
          backgroundColor: '#000000',
          color: '#ffffff',
        }
      }}
    >
      <DialogTitle id="alert-dialog-slide-title" style={{ color: '#ffffff' }}>
        🚀 NFTs Successfully Minted!
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          <Grid container spacing={1}>
            {mintedItems.map((nft, key) => {
              // Handle both old SDK structure (nft.json) and new Umi structure
              const metadata = (nft as any)?.json || (nft as any)?.metadata || {};
              const name = metadata.name || (nft as any)?.name || `NFT`;
              const image = metadata.image || (nft as any)?.image || '/nfts/1.png';
              const description = metadata.description || (nft as any)?.description || '';
              const mintAddress = (nft as any).mint?.publicKey || (nft as any).address || (nft as any).publicKey || (nft as any).mintAddress;

              return (
                <Grid item xs={4} key={key}>
                  <Card>
                    <CardActionArea>
                      <CardMedia
                        component="img"
                        //   alt="Contemplative Reptile"
                        //   height="140"
                        image={image}
                        //   title="Contemplative Reptile"
                      />
                      <CardContent>
                        <Typography gutterBottom variant="h5" component="h2">
                          {name}
                        </Typography>
                        {description && (
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            component="p"
                          >
                            {description}
                          </Typography>
                        )}
                    </CardContent>
                    <CardContent>
                      {metadata.attributes?.map(({ trait_type, value }) => (
                        <Chip
                          label={`${trait_type}: ${value}`}
                          variant="outlined"
                          key={trait_type}
                          style={{margin: 2}}
                        />
                      ))}
                    </CardContent>
                  </CardActionArea>
                  <CardActions style={{flexDirection: 'column', gap: '8px'}}>
                    {mintAddress && (
                      <Action style={{width: "100%"}} onClick={() => openOnSolscan(mintAddress.toString())}>View NFT on Solscan</Action>
                    )}
                    {(nft as any).signature && (
                      <Action style={{width: "100%", background: '#990000', color: 'white'}} onClick={() => openTransaction((nft as any).signature)}>View Transaction</Action>
                    )}
                  </CardActions>
                </Card>
              </Grid>
              )
            })}
          </Grid>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Action onClick={handleClose}>Close</Action>
      </DialogActions>
    </Dialog>
  );
}