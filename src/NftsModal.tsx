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

import { Nft, NftWithToken } from "@metaplex-foundation/js";

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
  mintedItems: (Nft | NftWithToken | MintedItem)[];
  setMintedItems: any;
  openOnSolscan: (key: string) => void
}) {
  const handleClose = () => {
    setMintedItems([]);
  };

  return (
    <Dialog
      open={!!mintedItems.length}
      keepMounted
      onClose={handleClose}
      aria-labelledby="alert-dialog-slide-title"
      aria-describedby="alert-dialog-slide-description"
      maxWidth={"md"}
    >
      <DialogTitle id="alert-dialog-slide-title">
        Nfts you had just minted!
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          <Grid container spacing={1}>
            {mintedItems.map((nft, key) => {
              // Handle both old SDK structure (nft.json) and new Umi structure
              const metadata = (nft as any)?.json || (nft as any)?.metadata || {};
              const name = metadata.name || (nft as any)?.name || `NFT #${key + 1}`;
              const image = metadata.image || (nft as any)?.image || '/nfts/1.png';
              const description = metadata.description || (nft as any)?.description || '';

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
                  <CardActions >
                    <Action style={{width: "100%"}} onClick={() => openOnSolscan(((nft as any).address || (nft as any).publicKey || (nft as any).mintAddress)?.toString())}>View on solscan</Action>
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
