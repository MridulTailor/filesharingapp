import React, { useState, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Card,
  Stack,
  Typography,
  Button,
  LinearProgress,
} from "@mui/material";
import { CopyToClipboard } from "react-copy-to-clipboard";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { useDropzone } from "react-dropzone";
import Constants from "./Constants";

const baseStyle = {
  width: "90%",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "black",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  outline: "none",
  transition: "border .24s ease-in-out",
};

const focusedStyle = {
  borderColor: "#2196f3",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileLink, setFileLink] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const allowedImageFormats = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/jpg",
    ];

    if (allowedImageFormats.includes(file.type)) {
      setFile(file);
      setError(null);
    } else {
      setError("File not supported");
    }
  };

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({ accept: { "image/*": [] }, onDrop: handleDrop });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  const fileSelectedHandler = (event) => {
    setFile(event.target.files[0]);
    setError(null);
  };

  const fileUploadHandler = async () => {
    if (!file) {
      setError("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("myFile", file);

    try {
      const response = await axios.post(
        `${Constants.API_URL}/api/files`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(progress);
          },
        }
      );

      if (response.status === 200) {
        const link = response.data.file;
        setFileLink(link);
        setIsCopied(false);
        setError(null);
      } else {
        console.error("File upload failed");
        setError("File upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Error uploading file");
    }
  };

  const handleCopy = () => {
    setIsCopied(true);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setFileLink(null);
    setIsCopied(false);
    setUploadProgress(0);
  };

  return (
    <Card sx={{ p: 2, mt: 2, width: "100%" }} elevation={5}>
      <Stack spacing={2} alignItems={"center"}>
        <div {...getRootProps({ style: style })} className="dropzone">
          <input {...getInputProps({})} />
          {file == null ? (
            <Stack justifyContent={"center"} alignItems={"center"} spacing={2}>
              <AllInboxIcon fontSize={"large"} />
              <Typography>
                Click or drag a file to this area to upload.
              </Typography>
            </Stack>
          ) : (
            <Stack
              sx={{ width: "100%" }}
              direction={"row"}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Stack spacing={2} direction={"row"} alignItems={"center"}>
                <InsertDriveFileIcon fontSize={"large"} />
                <Typography>{file.name}</Typography>
              </Stack>
              <HighlightOffIcon
                fontSize={"large"}
                onClick={clearFile}
                sx={{
                  cursor: "pointer",
                }}
              />
            </Stack>
          )}
        </div>
        <Button
          variant="contained"
          style={{ borderRadius: 50, width: "100%" }}
          disabled={
            file == null || uploadProgress > 0 || fileLink != null
              ? true
              : false
          }
          onClick={fileUploadHandler}
        >
          Upload
        </Button>
        {uploadProgress > 0 && (
          <LinearProgress variant="determinate" value={uploadProgress} />
        )}
        {fileLink && (
          <>
            <Typography variant="body1" gutterBottom>
              {fileLink}
            </Typography>
            <CopyToClipboard text={fileLink} onCopy={handleCopy}>
              <Button style={{ borderRadius: 50 }} variant="outlined">
                {isCopied ? "Copied!" : "Copy Link"}
              </Button>
            </CopyToClipboard>
          </>
        )}
        {error && (
          <Typography variant="body1" color={"red"} gutterBottom>
            {error}
          </Typography>
        )}
      </Stack>
    </Card>
  );
};

export default UploadPage;
