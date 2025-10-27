import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Session } from '@core/models/session.model';

@Component({
  selector: 'app-session-card',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './session-card.html',
  styleUrl: './session-card.scss',
})
export class SessionCard {
  @Input() session!: Session;
  @Output() revoke = new EventEmitter<number>();

  getDeviceIcon(deviceInfo: string): string {
    const lower = deviceInfo.toLowerCase();
    if (lower.includes('iphone') || lower.includes('android') || lower.includes('mobile')) {
      return 'smartphone';
    } else if (lower.includes('ipad') || lower.includes('tablet')) {
      return 'tablet';
    } else {
      return 'computer';
    }
  }

  onRevoke(): void {
    this.revoke.emit(this.session.id);
  }
}
