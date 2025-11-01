import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LanguageService } from '@core/services/language.service';
import { AuthService } from '@core/services/auth.service';
import { DashboardLayoutComponent } from '@shared/components/dashboard-layout/dashboard-layout';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DashboardLayoutComponent,
  ],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss',
})
export class EditProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);

  profileForm!: FormGroup;
  isLoading = signal<boolean>(false);
  hasChanges = signal<boolean>(false);

  private originalValues = {
    firstName: '',
    lastName: ''
  };

  ngOnInit(): void {
    this.initForm();
    this.setupChangeDetection();
  }

  private initForm(): void {
    const currentUser = this.authService.currentUser;

    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Store original values
    this.originalValues = {
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || ''
    };

    this.profileForm = this.fb.group({
      firstName: [this.originalValues.firstName, [Validators.required, Validators.minLength(2)]],
      lastName: [this.originalValues.lastName, [Validators.required, Validators.minLength(2)]],
    });
  }

  private setupChangeDetection(): void {
    this.profileForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  private checkForChanges(): void {
    const currentValues = this.profileForm.value;
    const changed =
      currentValues.firstName !== this.originalValues.firstName ||
      currentValues.lastName !== this.originalValues.lastName;

    this.hasChanges.set(changed);
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.hasChanges()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { firstName, lastName } = this.profileForm.value;

    this.authService.updateUserProfile(firstName, lastName).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.hasChanges.set(false);

        // Update original values
        this.originalValues = {
          firstName,
          lastName
        };

        this.snackBar.open(
          this.languageService.t('editProfile.successMessage'),
          '',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.router.navigate(['/profile']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open(
          this.languageService.t('editProfile.errorMessage'),
          '',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/profile']);
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }
}
