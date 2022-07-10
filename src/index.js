/**
 * This is the main entry point for your plugin.
 *
 * All information regarding plugin development can be found at
 * https://developer.vatom.com/plugins/plugins/
 *
 * @license MIT
 * @author Vatom Inc.
 */
export default class MyPlugin extends BasePlugin {

    /** Plugin info */
    static id = "jjv360.footsteps"
    static name = "Footstep Effects"

    /** Instance ID */
    instanceID = Math.random().toString(36).substring(2)

    /** Called on load */
    onLoad() {

        // Get all footprint sounds
        this.footprintSoundURLs = [
            this.paths.absolute('drip1.mp3'),
            this.paths.absolute('drip2.mp3'),
            this.paths.absolute('drip3.mp3'),
            this.paths.absolute('drip4.mp3'),
        ]

        // Preload audio
        for (let url of this.footprintSoundURLs)
            this.audio.preload(url)

        // Get user ID
        // this.userID = await this.user.getID()
        // if (!this.userID)
        //     throw new Error("Unable to get user ID on startup.")

        // Start timer
        setInterval(e => this.checkStep(), 100)

    }

    /** Called every so often to check if a step is made */
    async checkStep() {

        // Get user's position
        let position = await this.user.getPosition()

        // Stop if this is the first run
        if (!this.lastPosition) {
            this.lastPosition = position
            return
        }

        // Check for movement far enough to count as a step
        let distance = Math.sqrt((position.x - this.lastPosition.x)**2 + /*(position.y - this.lastPosition.y)**2 +*/ (position.z - this.lastPosition.z)**2)
        if (distance < 1.2)
            return

        // Position changed! Add footprint here
        this.lastPosition = position
        this.showFootstep(position)

        // Inform everyone else
        this.messages.send({
            action: 'footstep',
            position,
            instanceID: this.instanceID
        }, false)

    }

    /** Called when a message is received */
    onMessage(msg) {

        // Ignore if from us
        if (msg.instanceID == this.instanceID)
            return

        // Check message
        if (msg.action == 'footstep') {

            // Show footstep
            this.showFootstep(msg.position)

        }

    }

    /** Play footstep at the specified position */
    async showFootstep(position) {

        // Play random sound
        let url = this.footprintSoundURLs[Math.floor(Math.random() * this.footprintSoundURLs.length)]
        this.audio.play(url, {
            volume: 0.075,
            x: position.x,
            height: position.y,
            y: position.z,
            radius: 10
        })

        // Create ripple
        let rippleID = await this.objects.create({
            type: 'circle',
            scale: 0,
            transparent: true,
            opacity: 1,
            x: position.x,
            height: position.y - 0.1,
            y: position.z,
        })

        // Animate it
        let duration = 1000
        let startedAt = Date.now()
        while (true) {

            // Get progress of animation
            let progress = Math.min(1, (Date.now() - startedAt) / duration)

            // Update ripple
            this.objects.update(rippleID, {
                scale: 1 * progress,
                opacity: 1-progress
            })

            // Wait between frames
            await new Promise(c => setTimeout(c, 1000/30))

            // Stop if complete
            if (progress >= 1)
                break

        }

        // Remove ripple
        this.objects.remove(rippleID)

    }

}
