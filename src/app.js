// require('dotenv').config()

import React from 'react'
import ReactDOM from 'react-dom'
import axios from 'axios'
import 'bulma'
import Favicon from 'react-favicon'


import './style.scss'

import './animate.scss'

import NavBar from './components/navbar'
import Home from './components/home'
import ArtistProfile from './components/artistprofile'
import SpotifyLogin from 'react-spotify-login'

// const clientId = 'dc71ba45d71f4164bf80b79e4de42b9d'
// const redirectUri = 'http://localhost:8000/callback'

//
const clientId = process.env.SPOTIFY_CLIENT_ID
const redirectUri = checkRedirect()

function checkRedirect() {
  if (process.env.NODE_ENV !== 'production') {
    return process.env.LOCAL_REDIRECT_URI
  } else {
    return process.env.SPOTIFY_REDIRECT_URI
  }
}

const className = 'button is-info'

console.log('hello')

const lastFMToken = process.env.REACT_APP_LAST_FM_ACCESS_TOKEN
const musicMatchToken = process.env.REACT_APP_MUSIXMATCH_ACCESS_TOKEN

const initialState = { artistFullName: '', recommendations: '', topTracks: '', artistData: '', bio: '', token: '', country: '', mapCenter: '', search: '', pressed: 'is-fullheight-with-navbar', hidden: '', ontour: '' , genre: '', disappear: '' }


class App extends React.Component {
  constructor() {
    super()

    this.state = initialState

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.goToHome = this.goToHome.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
    this.onFailure = this.onFailure.bind(this)

  }

  onSuccess(response) {
    this.setState({...this.state, apiKey: response.access_token})
  }

  onFailure(response) {
    console.error(response)
  }

  grabRecommendations() {
    axios.get(`https://api.spotify.com/v1/recommendations?seed_artists=${this.state.artistId}&min_popularity=50`, {
      headers: {
        Authorization: `Bearer ${this.state.apiKey}`
      }
    })
      .then(res => this.setState({ recommendations: res.data }))
  }

  grabTopTracks() {
    axios.get(`https://api.spotify.com/v1/artists/${this.state.artistId}/top-tracks?country=US`, {
      headers: {
        Authorization: `Bearer ${this.state.apiKey}`
      }
    })
      .then(res => this.setState({ topTracks: res.data.tracks }))
  }


  grabArtist() {
    axios.get(`https://api.spotify.com/v1/recommendations?seed_artists=${this.state.artistId}&min_popularity=50`, {
      headers: {
        Authorization: `Bearer ${this.state.apiKey}`
      }
    })
      .then(res => this.setState({ artistData: res.data }))
  }

  grabArtistBio() {
    axios.get(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURI(this.state.artistFullName)}&api_key=${lastFMToken}&format=json`, {
    })
      .then(res => this.setState({ bio: res.data.artist.bio.summary, ontour: res.data.artist.ontour, genre: res.data.artist.tags.tag[0].name }))
      .then(() => this.removeString(this.state.bio))
      .then(() => this.checkOnTour())
  }

  grabArtistNationality() {
    axios.get(`https://cors-anywhere.herokuapp.com/https://api.musixmatch.com/ws/1.1/artist.search?q_artist=${encodeURI(this.state.artistFullName)}&apikey=${musicMatchToken}`, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        Authorization: `Bearer ${this.state.token}`
      }
    })
      .then(res => this.setState({ country: res.data.message.body.artist_list[0].artist.artist_country }))
      .then(() => this.grabLocation())
  }

  grabLocation() {
    axios.get(`https://restcountries.eu/rest/v2/alpha/${this.state.country}`)
      .then(res => this.setState({ mapCenter: {lat: res.data.latlng[0], lng: res.data.latlng[1]} }))
  }

  handleChange({ target: { value }}) {
    this.setState({ artistFullName: value})
  }

  handleSubmit(e) {
    e.preventDefault()
    axios.get(`https://api.spotify.com/v1/search?q=${encodeURI(this.state.artistFullName)}&type=artist`, {
      headers: {
        Authorization: `Bearer ${this.state.apiKey}`
      }
    })
      .then(res => this.setState({ search: res.data, artistId: res.data.artists.items[0].id, artist: res.data.artists.items[0].name, pressed: '', hidden: 'hidden', disappear: 'disappear' }))
      .then(() => this.grabRecommendations())
      .then(() => this.grabTopTracks())
      .then(() => this.grabArtist())
      .then(() => this.grabArtistBio())
      .then(() => this.grabArtistNationality())

  }

  checkOnTour() {
    console.log(this.state.ontour)
    if (this.state.ontour === '1') {
      this.setState({ ontourboolean: 'yes'})
    } else {
      this.setState({ ontourboolean: 'no'})
    }
  }

  removeString(string) {
    const position = string.search('<')
    const newBio = string.slice(0, position)
    this.setState({ newBio: `${newBio}...` })
  }

  goToHome() {
    this.setState({...initialState, pressed: 'is-fullheight-with-navbar', hidden: '' })
  }

  render() {
    return (
      <div>
        <Favicon url="https://i.imgur.com/lI0Sreq.png" />
        <NavBar
          goToHome={this.goToHome}
        />
        {!this.state.apiKey &&
          <div className='login-page'>
            <SpotifyLogin
              clientId={clientId}
              redirectUri={redirectUri}
              onSuccess={this.onSuccess}
              onFailure={this.onFailure}
              className={className}
            />
          </div>
        }
        {this.state.apiKey && <Home
          hasPressedGo={this.state.hasPressedGo}
          searched={this.state.search}
          pressed={this.state.pressed}
          hidden={this.state.hidden}
          disappear={this.state.disappear}
          handleSubmit={this.handleSubmit}
          handleChange={this.handleChange}
          artistFullName={this.state.artistFullName}
        />}
        {this.state.search &&
          <div>
            <ArtistProfile {...this.state} />
          </div>}
      </div>
    )
  }
}



ReactDOM.render(
  <App />,
  document.getElementById('root')
)
