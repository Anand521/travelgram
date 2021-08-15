import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import {finalize} from 'rxjs/operators';

import { AngularFireStorage } from '@angular/fire/storage'
import { AngularFireDatabase } from '@angular/fire/database';
import { readAndCompressImage } from 'browser-image-resizer';
import { imageConfig } from 'src/utils/config';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  picture:string="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.behance.net%2Fsearch%2Fprojects%3Fsearch%3DTravelgram&psig=AOvVaw0e3YKA2hC3rY_KwN1x2EkI&ust=1619767685438000&source=images&cd=vfe&ved=0CAIQjRxqFwoTCMDJ_f32ovACFQAAAAAdAAAAABAI"

  uploadPercent :number = null;

  constructor( private auth :AuthService,
    private router :Router,
    private db :AngularFireDatabase,
    private storage :AngularFireStorage,
    private  toastr :ToastrService


  ) { }

  ngOnInit(): void {
  }

  onSubmit( f:NgForm){
    const {email,password,username,country,bio,name} = f.form.value;
    //further sanitisation-do here

    this.auth.signUp(email,password).then((res)=>{
      console.log(res);
      const {uid}= res.user
      this.db.object(`/users/${uid}`)
      .set({
        id:uid,
        name:name,
        email:email,
        instaUserName:username,
        country:country,
        bio:bio,
        picture:this.picture
      })
    }).then(()=>{
      this.router.navigateByUrl('/');
      this.toastr.success("signUp success")

    }).catch((err)=>{
      this.toastr.error("signUp failed")
    })
  }
  async uploadFile(event){
    const file=event.target.files[0]

    let resizedImage=await readAndCompressImage(file,imageConfig)

    const filepath =file.name //rename the image with uuid
    const fileRef =this.storage.ref(filepath)

    const task =this.storage.upload(filepath,resizedImage);
    task.percentageChanges().subscribe((percentage)=>{
      this.uploadPercent= percentage
    });
    task.snapshotChanges().pipe(
      finalize(()=>{
        fileRef.getDownloadURL().subscribe((url)=>{
          this.picture=url;
          this.toastr.success('image upload success')
        });
      }),
    )
    .subscribe();

   }

}
