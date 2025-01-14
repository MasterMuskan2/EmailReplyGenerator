package com.email.email.app;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/email")
public class EmailGenController {
    public ResponseEntity<String> generateEmail(@RequestBody EmailReq emailReq){
        return ResponseEntity.ok("");
    }
}
