import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import './style.css';
import '98.css';

let currentStatus: 'Playing' | 'Paused' = 'Paused';
let currentVolume = 5;
let currentTime = '0:00';
let currentSong = '';
let currentAudio = new Audio();
let currentSongIndex = -1;
let shuffle = false;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div class="window" style="width:100%;height:100vh;">
  <div class="title-bar">
    <div class="title-bar-text">r o c k e t w a v e  radio</div>
    <div class="title-bar-controls">
      <button aria-label="Minimize"></button>
      <button aria-label="Maximize"></button>
      <button aria-label="Close"></button>
    </div>
  </div>

  <div class="status-bar">
    <div class="status-bar-field">Status: ${currentStatus}</div>

    <div class="status-bar-field">Volume: ${currentVolume}</div>
    <div class="status-bar-field">Time: ${currentTime}</div>
    <div class="status-bar-field">Song: ${currentSong}</div>
  </div>
  
  <div class="window-body">
    <div class="field-row" style="width: 300px">
      <label for="range25">Volume:</label>
      <label for="range26">Low</label>
      <input id="range26" type="range" min="1" max="11" value="5" />
      <label for="range27">High</label>
    </div>

    <div class="horizontal">
      <button id="playpause">Play</button>
      <button id="stop">Stop</button>
      <button id="next">Next</button>
      <button id="prev">Prev</button>
    </div>

    <input type="checkbox" id="shuffle">
    <label for="shuffle">Shuffle</label>

    <br />

    <span>Musics licensed under <a href="https://creativecommons.org/about/cclicenses/">Creative Commons</a> Licenses.</span>
    
    <div class="error">
    
    </div>
    
    <div class="loading">
    
    </div>
    
    <div class="fcr">
      ${aestheticWord()} brought to you by <a href="https://www.fogcityrocketry.com">Fog City Rocketry</a>.
    </div>

    <img src="/lofi-vaporwave.gif" style="width: 70%; height: 70%; object-fit: cover; object-position: center; margin-top: 5%;"/>
  </div>  
</div>
`

interface Song {
  songName: string;
  artistName: string;
  fileName: string;
}

const CORS_PROXY = 'hidden-badlands-27630.herokuapp.com';
const FETCH_INTERRUPT = false; // TODO: remove this
let songList: Song[] = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (FETCH_INTERRUPT) return;
  try {
    const songsResponse = await fetch(`https://${CORS_PROXY}/https://firebasestorage.googleapis.com/v0/b/hanlon-blog.appspot.com/o/songs%2Fmanifest.json?alt=media&token=73b8c3db-ced9-407f-8d23-d2ec5ae55642`);
    const songs: Song[] = await songsResponse.json();
    songList = songs;
    getMusicFromStorage(songList[0].fileName);
  } catch {
    document.querySelector<HTMLDivElement>('.error')!.innerHTML = 'Error: could not fetch songs.';
  }

  document.querySelector<HTMLInputElement>('#shuffle')!.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    shuffle = target.checked;
  });
});

document.getElementById('range26')!.addEventListener('input', (e) => {
  const target = e.target as HTMLInputElement;
  currentVolume = parseInt(target.value);
  document.querySelector<HTMLDivElement>('.status-bar-field:nth-child(2)')!.innerHTML = `Volume: ${currentVolume}`;

  currentAudio.volume = (currentVolume - 1) / 10;
});

document.getElementById('playpause')!.addEventListener('click', () => {
  switch (currentStatus) {
    case 'Paused':
      play();
      break;
    case 'Playing':
      pause();
      break;
  }

  document.querySelector<HTMLButtonElement>('#playpause')!.innerHTML = currentStatus === 'Playing' ? 'Pause' : 'Play';
});

document.getElementById('stop')!.addEventListener('click', () => {
  pause(true);
});

document.getElementById('next')!.addEventListener('click', () => {
  next();
});

document.getElementById('prev')!.addEventListener('click', () => {
  prev();
});

setInterval(() => {
  const minutes = Math.floor(currentAudio.currentTime / 60);
  const seconds = Math.floor(currentAudio.currentTime % 60);
  currentTime = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  document.querySelector<HTMLDivElement>('.status-bar-field:nth-child(3)')!.innerHTML = `Time: ${currentTime}`;
}, 1000);

function play() {
  currentAudio.play();
  currentStatus = 'Playing';
  document.querySelector<HTMLDivElement>('.status-bar-field:nth-child(1)')!.innerHTML = `Status: ${currentStatus}`;
  document.querySelector<HTMLButtonElement>('#playpause')!.innerHTML = 'Pause';
}

function pause(stop: boolean = false) {
  currentAudio.pause();
  currentStatus = 'Paused';
  document.querySelector<HTMLDivElement>('.status-bar-field:nth-child(1)')!.innerHTML = `Status: ${currentStatus}`;
  document.querySelector<HTMLButtonElement>('#playpause')!.innerHTML = 'Play';
  if (stop) {
    currentAudio.currentTime = 0;
    document.querySelector<HTMLDivElement>('.status-bar-field:nth-child(3)')!.innerHTML = `Time: 0:00`;
  }
}

async function prev() {
  if (currentAudio.currentTime > 5) {
    currentAudio.currentTime = 0;
    return;
  }

  pause(true);

  if (shuffle) {
    currentSongIndex = Math.floor(Math.random() * songList.length);

  } else {
    currentSongIndex = (currentSongIndex - 1) % songList.length;
  }

  await getMusicFromStorage(songList[currentSongIndex].fileName);
  play();
}

async function next() {
  pause(true);

  if (shuffle) {
    currentSongIndex = Math.floor(Math.random() * songList.length);

  } else {
    currentSongIndex = (currentSongIndex + 1) % songList.length;
  }

  await getMusicFromStorage(songList[currentSongIndex].fileName);
  play();
}

function aestheticWord(): string {
  const random = Math.floor(Math.random() * 8);

  switch (random) {
    case 0:
      return 'A e s t h e t i c a l l y';
    case 1:
      return 'Wavily';
    case 2:
      return 'Vaporously';
    case 3:
      return 'Glitchily';
    case 4:
      return 'Synthetically';
    case 5:
      return 'Retroactively';
    case 6:
      return 'Nostalgically';
    case 7:
      return 'Cyperpunkly';
    case 8:
      return 'Futuristically';
  }

  return 'A e s t h e t i c a l l y';
}

function songName(index: number) {
  return `${songList[index].songName} - ${songList[index].artistName}`;
}

const firebaseConfig = {
  apiKey: "AIzaSyBrlrCW8PQ9ux95-_4uHlSXyauctMPORNo",
  authDomain: "hanlon-blog.firebaseapp.com",
  databaseURL: "https://hanlon-blog-default-rtdb.firebaseio.com",
  projectId: "hanlon-blog",
  storageBucket: "hanlon-blog.appspot.com",
  messagingSenderId: "435388176194",
  appId: "1:435388176194:web:cc98ef5a6ffd249b889adb",
  measurementId: "G-RP8SSGMB5B"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function getMusicFromStorage(fileName: string) {
  document.querySelector<HTMLDivElement>('.loading')!.innerHTML = 'Loading...';
  try {
    const musicRef = ref(storage, `songs/${fileName}`);
    const url = await getDownloadURL(musicRef);
    const audioResponse = await fetch(`https://${CORS_PROXY}/${url}`);
    const audioBlob = await audioResponse.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
  
    currentAudio = new Audio(audioUrl);  
    if (currentSongIndex === -1) currentSongIndex = 0;

    currentSong = songName(currentSongIndex);
    document.querySelector<HTMLDivElement>('.status-bar-field:nth-child(4)')!.innerHTML = `Song: ${currentSong}`;
  } catch(e) {
    console.error(e);
    document.querySelector<HTMLDivElement>('.error')!.innerHTML = 'Error: could not fetch song.';
  }

  document.querySelector<HTMLDivElement>('.loading')!.innerHTML = '';
}
