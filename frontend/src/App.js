import { useState, forwardRef } from "react";
import "./App.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Slide from "@mui/material/Slide";
import { ReactComponent as MonkeySVG } from "./assets/monkey.svg";

import { Route, Routes } from "react-router-dom";
import UploadPage from "./UploadPage";
import DownloadPage from "./DownloadPage";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function App() {
  const [open, setOpen] = useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  return (
    <div
      style={{
        height: "95vh",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
      className="App"
    >
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>{"Credits: "}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            <ul>
              <li>
                Design Inspiration:{" "}
                <a href="https://dribbble.com/shots/23301838-UI-31-File-Upload">
                  https://dribbble.com/shots/23301838-UI-31-File-Upload
                </a>{" "}
              </li>
              <li>
                Monkey SVG:{" "}
                <a href="https://www.freepik.com/free-vector/fishing-monkey-cartoon-character_18212404.htm#query=fisherman%20svg%20file&position=42&from_view=keyword&track=ais&uuid=30867ccb-ed06-4826-894e-1370aae3904b">
                  Image by brgfx
                </a>{" "}
                on Freepik
              </li>
            </ul>
          </DialogContentText>
        </DialogContent>
      </Dialog>

      <Tooltip arrow placement="top-start" title="Click to view credits">
        <Typography
          onClick={() => {
            handleClickOpen();
          }}
          sx={{
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 1,
            position: "relative",
          }}
          variant="h3"
          component="h1"
          gutterBottom
        >
          WildShare
          <MonkeySVG
            style={{
              position: "absolute",
              bottom: 45,
              right: 10,
              zIndex: -1,
            }}
          />
        </Typography>
      </Tooltip>

      <Routes>
        <Route path="/" exact element={<UploadPage />} />
        <Route path="/files/:uuid" element={<DownloadPage />} />
      </Routes>
    </div>
  );
}

export default App;
