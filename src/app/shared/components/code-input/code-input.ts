import { Component, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-code-input',
  imports: [CommonModule, FormsModule, MatInputModule, MatFormFieldModule],
  templateUrl: './code-input.html',
  styleUrl: './code-input.scss',
})
export class CodeInput implements AfterViewInit {
  @Input() length: number = 6;
  @Input() disabled: boolean = false;
  @Output() codeComplete = new EventEmitter<string>();
  @ViewChildren('codeInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  digits: string[] = [];

  ngAfterViewInit(): void {
    this.digits = new Array(this.length).fill('');
    setTimeout(() => {
      this.inputs.first?.nativeElement.focus();
    });
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow numeric input
    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }

    this.digits[index] = value.slice(-1);
    input.value = this.digits[index];

    // Move to next input if value entered
    if (value && index < this.length - 1) {
      const nextInput = this.inputs.toArray()[index + 1];
      nextInput?.nativeElement.focus();
    }

    // Emit complete code
    if (this.digits.every(d => d !== '')) {
      this.codeComplete.emit(this.digits.join(''));
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Handle backspace
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        // Move to previous input if current is empty
        const prevInput = this.inputs.toArray()[index - 1];
        prevInput?.nativeElement.focus();
      } else {
        // Clear current input
        this.digits[index] = '';
        input.value = '';
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';

    if (pastedData && /^\d+$/.test(pastedData)) {
      const pastedDigits = pastedData.slice(0, this.length).split('');

      pastedDigits.forEach((digit, i) => {
        this.digits[i] = digit;
        const input = this.inputs.toArray()[i];
        if (input) {
          input.nativeElement.value = digit;
        }
      });

      if (pastedDigits.length === this.length) {
        this.codeComplete.emit(this.digits.join(''));
        this.inputs.toArray()[this.length - 1]?.nativeElement.focus();
      } else {
        this.inputs.toArray()[pastedDigits.length]?.nativeElement.focus();
      }
    }
  }
}
