import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import Constants from "./Constants";

const DownloadPage = () => {
  const { uuid } = useParams();
  const [fileInfo, setFileInfo] = useState(null);

  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const response = await axios.get(`${Constants.API_URL}/files/${uuid}`);
        setFileInfo(response.data);
      } catch (error) {
        console.error("Error fetching file details:", error);
        // Handle the error as needed
      }
    };

    fetchFileDetails();
  }, [uuid]);

  const handleDownload = () => {
    // Fetch the file directly and trigger download
    fetch(`${Constants.API_URL}/files/download/${uuid}`, {
      headers: {
        // Add any additional headers if needed
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", fileInfo.filename || "file");
        document.body.appendChild(link);
        link.click();
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
        // Handle the error as needed
      });
  };

  return (
    <Card sx={{ p: 2, mt: 2, width: "100%" }} elevation={5}>
      <Stack
        spacing={2}
        justifyContent={"center"}
        alignItems={"center"}
        style={{
          border: "2px dashed #bbb",
          borderRadius: "4px",
          cursor: "pointer",
          padding: "20px",
          textAlign: "center",
          marginBottom: "10px",
        }}
      >
        <FileCopyIcon style={{ fontSize: 50 }} />
        <Typography variant="h5" component="h1">
          <b>File Download</b>
        </Typography>

        {fileInfo ? (
          <Box width={"100%"}>
            <Typography variant="body1" gutterBottom>
              Filename: {fileInfo.filename}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Size: {fileInfo.size / (1024 * 1024)} MB
            </Typography>
            <Typography variant="body1" gutterBottom>
              Uploaded On: {new Date(fileInfo.createdAt).toLocaleString()}
            </Typography>
            <Button
              variant="contained"
              style={{ width: "100%", borderRadius: 50 }}
              onClick={handleDownload}
            >
              Download File
            </Button>
          </Box>
        ) : (
          <Typography variant="body1" gutterBottom>
            Loading file details...
          </Typography>
        )}
      </Stack>
    </Card>
  );
};

export default DownloadPage;
