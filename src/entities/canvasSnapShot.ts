import { time } from "node:console";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity('CANVAS_SNAP_SHOT')
export class canvasSnapShot {
    
    @PrimaryGeneratedColumn({ name: 'ID' })
    Id!: number;

    @Column({
        type: 'jsonb',
        nullable: false,
        default: {}, 
        name: 'PIXELCANVAS'
    })
    pixelCanvasJson!: Record<string, any>;

    @Column({
        type: 'timestamp with time zone',
        nullable: false,
        default: () => 'CURRENT_TIMESTAMP',
        name: 'LAST_TIME_SAVED'
    })
    lastTimeUpdated!: Date;
}