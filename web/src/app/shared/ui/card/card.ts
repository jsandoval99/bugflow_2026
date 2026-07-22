import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [NgClass],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class CardComponent {
  @Input() ariaLabel = '';
  @Input() role = '';
  @Input() class = '';
}
