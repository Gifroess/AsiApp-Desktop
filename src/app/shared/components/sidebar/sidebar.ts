import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Observable } from 'rxjs';
import { UserInterface } from '../../interfaces/user-interface';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  usuario$!: Observable<UserInterface | null>;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.usuario$ = this.authService.getUserData();
  }
}