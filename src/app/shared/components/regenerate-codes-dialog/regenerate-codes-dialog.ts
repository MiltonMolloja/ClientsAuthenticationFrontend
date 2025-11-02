import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { NotificationService } from '@core/services/notification.service';
import { CodeInput } from '@shared/components/code-input/code-input';

@Component({
  selector: 'app-regenerate-codes-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CodeInput
  ],
  templateUrl: './regenerate-codes-dialog.html',
  styleUrl: './regenerate-codes-dialog.scss',
})
export class RegenerateCodesDialogComponent implements OnInit {
  regenerateForm!: FormGroup;
  isRegenerating = false;
  showPassword = false;
  verificationCode = '';

  constructor(
    private dialogRef: MatDialogRef<RegenerateCodesDialogComponent>,
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.regenerateForm = this.fb.group({
      password: ['', [Validators.required]],
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  onCodeComplete(code: string): void {
    this.verificationCode = code;
    this.regenerateForm.patchValue({ code });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onConfirm(): void {
    if (this.regenerateForm.valid) {
      this.isRegenerating = true;

      const userId = this.authService.currentUser?.id;
      if (!userId) {
        this.notificationService.showError('User not found');
        this.isRegenerating = false;
        return;
      }

      const request = {
        userId: userId,
        password: this.regenerateForm.value.password,
        code: this.regenerateForm.value.code
      };

      this.authService.regenerateBackupCodes(request).subscribe({
        next: (response) => {
          this.isRegenerating = false;
          this.notificationService.showSuccess(
            this.languageService.t('security.codesRegeneratedSuccess')
          );
          // Close dialog and return new codes
          this.dialogRef.close(response.backupCodes);
        },
        error: (error) => {
          this.isRegenerating = false;
          const errorMessage = error?.error?.message || 'Failed to regenerate backup codes';
          this.notificationService.showError(errorMessage);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
