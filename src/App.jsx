import "./App.css";

import awsconfig from "./aws-exports";
import { AmplifySignOut, withAuthenticator } from "@aws-amplify/ui-react";
import Amplify, { API, graphqlOperation, Storage } from "aws-amplify";

import React, { useEffect, useState } from "react";
import { listSongs } from "./graphql/queries";
import { updateSong } from "./graphql/mutations";

import ReactPlayer from "react-player";

import { IconButton, Paper } from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import FavoriteIcon from "@material-ui/icons/Favorite";
import PauseIcon from "@material-ui/icons/Pause";
import AddIcon from "@material-ui/icons/Add";

import AddSong from "./AddSong";

Amplify.configure(awsconfig);

function App() {
  const [songs, setSongs] = useState([]);
  const [songPlaying, setSongPlaying] = useState("");
  const [audioURL, setAudioURL] = useState("");
  const [showAddSong, setShowAddNewSong] = useState(false);

  const fetchSongs = async () => {
    try {
      const songData = await API.graphql(graphqlOperation(listSongs));
      const songList = songData.data.listSongs.items;
      console.log("song list", songList);
      setSongs(songList);
    } catch (error) {
      console.log("error on fetching songs", error);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const addLike = async (idx) => {
    try {
      const song = songs[idx];
      song.likes = song.likes + 1;
      delete song.createdAt;
      delete song.updatedAt;

      const songData = await API.graphql(
        graphqlOperation(updateSong, { input: song })
      );
      const songList = [...songs];
      songList[idx] = songData.data.updateSong;
      setSongs(songList);
    } catch (error) {
      console.log("error on adding Like to song", error);
    }
  };

  const toggleSong = async (idx) => {
    if (songPlaying === idx) {
      setSongPlaying("");
      return;
    }

    const songFilePath = songs[idx].filePath;

    try {
      const fileAccessURL = await Storage.get(songFilePath, { expires: 60 });
      console.log("access url", fileAccessURL);
      setSongPlaying(idx);
      setAudioURL(fileAccessURL);
      return;
    } catch (error) {
      console.error("error accessing the file from s3", error);
      setAudioURL("");
      setSongPlaying("");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <AmplifySignOut />
        <h2>My App Content</h2>
      </header>
      <div className="songList">
        {songs.map((song, idx) => {
          return (
            <Paper variant="outlined" elevation={2} key={`song${idx}`}>
              <div className="songCard">
                <IconButton aria-label="play" onClick={() => toggleSong(idx)}>
                  {songPlaying === idx ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>

                <div>
                  <div className="songTitle">{song.title}</div>
                  <div className="songOwner">{song.owner}</div>
                </div>

                <div>
                  <IconButton aria-label="like" onClick={() => addLike(idx)}>
                    <FavoriteIcon />
                  </IconButton>
                  {song.likes}
                </div>

                <div className="songDescription">{song.description}</div>
              </div>
              {songPlaying === idx ? (
                <div className="ourAudioPlayer">
                  <ReactPlayer
                    url={audioURL}
                    controls
                    playing
                    height="50px"
                    onPause={() => toggleSong(idx)}
                  />
                </div>
              ) : null}
            </Paper>
          );
        })}

        {showAddSong ? (
          <AddSong
            onUpload={() => {
              setShowAddNewSong(false);
              fetchSongs();
            }}
          />
        ) : (
          <IconButton onClick={() => setShowAddNewSong(true)}>
            <AddIcon />
          </IconButton>
        )}
      </div>
    </div>
  );
}

export default withAuthenticator(App);
