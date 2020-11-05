import { Component, Input } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { JsonPipe } from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'TwitchHelpers';
  confirmed_bots = []
  @Input() username: string; // decorate the property with @Input()
  username_notfound: false;
  chatters: { 
    viewer_count: number,
    follower_count: number,
    confirmed_bot_count: number,
    viewers: Array<{name: string, isFollowing: boolean, date: string, isConfirmedBot: boolean, typeClass: string}>
  } = { 
    viewer_count: 0,
    follower_count: 0,
    confirmed_bot_count: 0,
    viewers: []
  }

  constructor(private http: HttpClient) { 
    this.setConfirmedBots();
  }

  setConfirmedBots() {
    let url = 'https://api.twitchinsights.net/v1/bots/all';
    this.http.get(url).subscribe((data: []) => {
      let bots = data['bots'];

      for(var i=0;i<bots.length;i++) {
        this.confirmed_bots[i] = bots[i][0];
      }
    });
  }

   getLiveViewers(username) {
     username = username.toLowerCase()
    let url = 'https://tmi.twitch.tv/group/user/' + username + '/chatters';

    let headers = new HttpHeaders();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Origin','http://localhost:4200');
    headers.append('Access-Control-Allow-Origin', '*');

    return this.http.get(url);
  }


  getViewers() {
    this.getLiveViewers(this.username).subscribe((data) => {
      this.chatters.viewers = [];
      this.chatters.follower_count = 0;
      this.chatters.confirmed_bot_count = 0;
      this.chatters.viewer_count = parseInt(data['chatter_count'])-1; //remove broadcaster

      var allUsers = [];

      for(var i=0;i<data['chatters']['viewers'].length; i++) {
        let viewer = data['chatters']['viewers'][i];
        allUsers.push(viewer);
      }

      for(var i=0;i<data['chatters']['vips'].length;i++) {
        let viewer = data['chatters']['vips'][i];
        allUsers.push(viewer)
      }

      for(var i=0;i<data['chatters']['moderators'].length;i++) {
        let viewer = data['chatters']['moderators'][i];
        allUsers.push(viewer);
      }

      for(var i=0;i<allUsers.length;i++) {
        let viewer = allUsers[i];
        let viewer_i = i;
        this.chatters.viewers[i] = {name: viewer, isFollowing: false, date: 'Not following', isConfirmedBot:false, typeClass: "non-follower"};

        for(var j=0;j<this.confirmed_bots.length;j++) {
          if (viewer == this.confirmed_bots[j]) {
            this.chatters.confirmed_bot_count++;
            this.chatters.viewers[i].isConfirmedBot = true;
            this.chatters.viewers[i].date = "Confirmed bot"
            break;
          }
        }

        this.checkIfFollow(viewer, this.username).subscribe((data) => {
          let date = JSON.parse(data.substring(18, data.length-2));

          if(date.data.length > 0) {
            this.chatters.viewers[viewer_i] = { name: viewer, isFollowing:true, date: date.data[0].followed_at, isConfirmedBot:true, typeClass:"follower" }
            this.chatters.follower_count++;
          }
          else
          {
            if(this.chatters.viewers[viewer_i].isConfirmedBot)
            {
              this.chatters.viewers[viewer_i].typeClass = "bot"
            }
          }
        });
      }

    });
  }

  checkIfFollow(username, follow) {
    let url = 'https://twitch.center/follow?username=' + username + '&channel=' + follow + '&callback=angular.callbacks'

    return this.http.get(url, {responseType: 'text'});
  }
}
